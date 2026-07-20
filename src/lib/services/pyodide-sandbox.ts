import { Worker } from "worker_threads";
import { createRequire } from "module";
import { loadPyodide } from "pyodide";

const requireCjs = createRequire(import.meta.url);

let pyodidePath: string | null = null;
try {
  pyodidePath = requireCjs.resolve("pyodide");
} catch (err) {
  console.warn("[Pyodide Sandbox] Local pyodide module resolution failed. Will fallback to CDN / Main Thread if needed:", err);
}

export interface PythonExecutionResult {
  success: boolean;
  output: any;
  stdout: string;
  stderr: string | null;
  durationMs: number;
}

// Caching and queueing for main-thread execution
let cachedPyodide: any = null;
let executionMutex = Promise.resolve();

async function runWithMutex<T>(fn: () => Promise<T>): Promise<T> {
  const previous = executionMutex;
  let resolveMutex: () => void;
  executionMutex = new Promise((resolve) => {
    resolveMutex = resolve;
  });
  await previous;
  try {
    return await fn();
  } finally {
    resolveMutex!();
  }
}

async function getPyodideInstance() {
  if (!cachedPyodide) {
    // Load pyodide with the jsDelivr CDN fallback to avoid local WebAssembly file requirements.
    // fullStdLib: false  → no stdlib pre-cargado; sólo lo que la allowlist instale.
    cachedPyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/",
      fullStdLib: false,
    });
    // ── Hardening de red (ASVS 12.3.1) ──
    // Pyodide expone `pyodide.http.pyfetch` que permite al código del usuario
    // hacer peticiones HTTP a cualquier URL (exfiltración, C2, descarga de payloads).
    // Lo eliminamos completamente para que el sandbox no tenga salida de red.
    try {
      const py = cachedPyodide;
      // Borrar el módulo http para impedir pyodide.http.pyfetch / open_url
      py.registerJsModule = py.registerJsModule; // no-op, evita tree-shake
      py.runPythonAsync(`
import sys
# Eliminar módulos de red del sandbox
for _m in ["pyodide.http", "pyodide.http"]:
    try:
        del sys.modules[_m]
    except KeyError:
        pass
try:
    import pyodide
    class _Disabled:
        def __getattr__(self, _): raise RuntimeError("Red deshabilitada en el sandbox")
        def __setattr__(self, *_): raise RuntimeError("Red deshabilitada en el sandbox")
    pyodide.http = _Disabled()
except Exception:
    pass
# Bloquear urllib del stdlib por si un paquete lo importa
try:
    import sys as _sys
    _sys.modules["urllib.request"] = None
    _sys.modules["urllib3"] = None
    _sys.modules["ssl"] = None
except Exception:
    pass
# Eliminar __builtins__ peligrosos que permiten evadir el regex denylist del route handler
import builtins as _b
for _name in ["__import__", "eval", "exec", "compile", "globals", "vars"]:
    if hasattr(_b, _name):
        setattr(_b, _name, lambda *a, **k: (_ for _ in ()).throw(
            RuntimeError(f"Función '{_name}' deshabilitada en el sandbox")))
`);
    } catch (err) {
      console.error("[Pyodide Sandbox] Fallo al aplicar hardening de red/builtins:", err);
      // Invalidar la caché para no dejar una instancia sin endurecer
      cachedPyodide = null;
      throw err;
    }
  }
  return cachedPyodide;
}

/**
 * Runs Python code inside the main thread using CDN assets.
 * Used on serverless (Vercel) to avoid pathing and packaging issues with worker threads.
 */
async function runPythonInMainThread(
  script: string,
  context: Record<string, any> = {},
  packages: string[] = [],
  timeoutMs: number = 15000
): Promise<PythonExecutionResult> {
  const t0 = Date.now();
  return runWithMutex(async () => {
    try {
      const py = await getPyodideInstance();

      let stdoutBuffer = "";
      let stderrBuffer = "";

      // ── Carga de paquetes sin descargas arbitrarias ──
      // ANTES: micropip.install(packages) descargaba wheels de PyPI/internet,
      // permitiendo exfiltración y bypass de la allowlist. AHORA: py.loadPackage
      // sólo resuelve paquetes del catálogo oficial de Pyodide (que viene del
      // indexURL) y los carga desde ahí. Los paquetes ya están filtrados por
      // la PACKAGE_ALLOWLIST del route handler, así que no puede llegar nada
      // fuera de la lista blanca.
      if (packages && packages.length > 0) {
        const cleanPackages = packages.filter((p: any) => typeof p === "string" && p.trim().length > 0);
        if (cleanPackages.length > 0) {
          try {
            await py.loadPackage(cleanPackages, { messageCallback: () => {} });
          } catch (loadErr: any) {
            return {
              success: false,
              output: null,
              stdout: "",
              stderr: `Paquete no disponible en el catálogo del sandbox. Sólo se permiten paquetes de la lista blanca.`,
              durationMs: Date.now() - t0,
            };
          }
        }
      }
      
      const decoder = new TextDecoder("utf-8");
      py.setStdout({
        write: (text: any) => {
          const decoded = typeof text === "string" ? text : decoder.decode(text, { stream: true });
          stdoutBuffer += decoded;
          return text.length;
        }
      });
      
      py.setStderr({
        write: (text: any) => {
          const decoded = typeof text === "string" ? text : decoder.decode(text, { stream: true });
          stderrBuffer += decoded;
          return text.length;
        }
      });
      
      // Inject execution context variables
      const locals = py.toPy(context || {});
      
      // Execute in WebAssembly with a timeout
      const executionPromise = py.runPythonAsync(script, { locals });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout de ejecución de Python excedido (${timeoutMs}ms).`)), timeoutMs)
      );
      
      const rawResult = await Promise.race([executionPromise, timeoutPromise]);
      
      let output = null;
      if (rawResult) {
        if (typeof rawResult.toJs === 'function') {
          output = rawResult.toJs({ create_proxies: false });
        } else {
          output = rawResult;
        }
      }
      
      const durationMs = Date.now() - t0;
      return {
        success: true,
        output,
        stdout: stdoutBuffer,
        stderr: stderrBuffer || null,
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      return {
        success: false,
        output: null,
        stdout: "",
        stderr: err.message || String(err),
        durationMs
      };
    }
  });
}

/**
 * Executes Python script in an isolated WebAssembly sandbox.
 * Spawns a worker thread locally/development, but falls back to main-thread CDN
 * execution in serverless environments or if worker thread package loading fails.
 */
export async function runPythonCode(
  script: string,
  context: Record<string, any> = {},
  packages: string[] = [],
  timeoutMs: number = 15000 // 15-second default timeout
): Promise<PythonExecutionResult> {
  const t0 = Date.now();
  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

  if (isServerless || !pyodidePath) {
    return runPythonInMainThread(script, context, packages, timeoutMs);
  }

  return new Promise((resolve) => {
    // Worker script as an inline string
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      
      // Fix missing fd properties on process.stdout/stderr in Node.js worker threads (required for Pyodide writes)
      if (process.stdout && typeof process.stdout.fd === 'undefined') {
        process.stdout.fd = 1;
      }
      if (process.stderr && typeof process.stderr.fd === 'undefined') {
        process.stderr.fd = 2;
      }
      
      async function main() {
        try {
          const { script, context, packages, pyodidePath } = workerData;
          const { loadPyodide } = require(pyodidePath);

          let stdoutBuffer = "";
          let stderrBuffer = "";

          // Loads local Pyodide WebAssembly binaries (sin stdlib completo)
          const py = await loadPyodide({ fullStdLib: false });

          // ── Hardening de red + builtins (igual que en main-thread) ──
          try {
            py.runPythonAsync(\`
import sys
try:
    import pyodide
    class _Disabled:
        def __getattr__(self, _): raise RuntimeError("Red deshabilitada en el sandbox")
        def __setattr__(self, *_): raise RuntimeError("Red deshabilitada en el sandbox")
    pyodide.http = _Disabled()
except Exception:
    pass
for _m in ["urllib.request", "urllib3", "ssl"]:
    try: sys.modules[_m] = None
    except Exception: pass
import builtins as _b
for _n in ["__import__", "eval", "exec", "compile", "globals", "vars"]:
    if hasattr(_b, _n):
        setattr(_b, _n, lambda *a, **k: (_ for _ in ()).throw(RuntimeError("Función '" + _n + "' deshabilitada en el sandbox")))
\`);
          } catch (hErr) {
            parentPort.postMessage({ success: false, error: "No se pudo inicializar el sandbox seguro: " + (hErr.message || hErr) });
            return;
          }

          // Cargar paquetes sólo desde catálogo oficial (no descargas arbitrarias)
          if (packages && packages.length > 0) {
            const cleanPackages = packages.filter(p => typeof p === 'string' && p.trim().length > 0);
            if (cleanPackages.length > 0) {
              await py.loadPackage(cleanPackages, { messageCallback: () => {} });
            }
          }
          
          // Set stdout/stderr buffers with byte-to-string decoding support
          const decoder = new TextDecoder("utf-8");
          py.setStdout({
            write: (text) => {
              const decoded = typeof text === "string" ? text : decoder.decode(text, { stream: true });
              stdoutBuffer += decoded;
              return text.length;
            }
          });
          
          py.setStderr({
            write: (text) => {
              const decoded = typeof text === "string" ? text : decoder.decode(text, { stream: true });
              stderrBuffer += decoded;
              return text.length;
            }
          });
          
          // Inject execution context variables
          const locals = py.toPy(context || {});
          
          // Execute code in WebAssembly
          const rawResult = await py.runPythonAsync(script, { locals });
          
          let output = null;
          if (rawResult) {
            if (typeof rawResult.toJs === 'function') {
              output = rawResult.toJs({ create_proxies: false });
            } else {
              output = rawResult;
            }
          }
          
          parentPort.postMessage({
            success: true,
            output,
            stdout: stdoutBuffer,
            stderr: stderrBuffer || null
          });
        } catch (err) {
          parentPort.postMessage({
            success: false,
            error: err.message || String(err)
          });
        }
      }
      
      main();
    `;

    try {
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: { script, context, packages, pyodidePath },
      });

      // Terminate worker if it runs longer than timeoutMs
      const timeout = setTimeout(async () => {
        try {
          await worker.terminate();
        } catch (err) {
          console.error("[Pyodide Sandbox] Error terminating worker thread on timeout:", err);
        }
        const durationMs = Date.now() - t0;
        resolve({
          success: false,
          output: null,
          stdout: "",
          stderr: `Timeout de ejecución de Python excedido (${timeoutMs}ms). Ejecución abortada por seguridad de la plataforma.`,
          durationMs,
        });
      }, timeoutMs);

      worker.on("message", (msg) => {
        clearTimeout(timeout);
        const durationMs = Date.now() - t0;
        if (!msg.success && msg.error && msg.error.includes("Cannot find module 'pyodide'")) {
          console.warn("[Pyodide Sandbox] Worker thread failed to resolve pyodide module. Falling back to main-thread execution.");
          runPythonInMainThread(script, context, packages, timeoutMs).then(resolve);
          return;
        }
        resolve({
          success: msg.success,
          output: msg.output || null,
          stdout: msg.stdout || "",
          stderr: msg.success ? msg.stderr : (msg.error || "Error desconocido"),
          durationMs,
        });
      });

      worker.on("error", (err) => {
        clearTimeout(timeout);
        const durationMs = Date.now() - t0;
        if (err.message && err.message.includes("Cannot find module 'pyodide'")) {
          console.warn("[Pyodide Sandbox] Worker thread encountered error. Falling back to main-thread execution:", err.message);
          runPythonInMainThread(script, context, packages, timeoutMs).then(resolve);
          return;
        }
        resolve({
          success: false,
          output: null,
          stdout: "",
          stderr: err.message || String(err),
          durationMs,
        });
      });

      worker.on("exit", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          const durationMs = Date.now() - t0;
          resolve({
            success: false,
            output: null,
            stdout: "",
            stderr: `El sandbox de ejecución finalizó inesperadamente (Código de salida: ${code}).`,
            durationMs,
          });
        }
      });
    } catch (err: any) {
      console.warn("[Pyodide Sandbox] Failed to spawn worker thread. Falling back to main-thread execution:", err);
      runPythonInMainThread(script, context, packages, timeoutMs).then(resolve);
    }
  });
}

