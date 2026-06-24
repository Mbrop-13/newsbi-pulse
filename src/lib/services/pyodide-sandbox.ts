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
    // Load pyodide with the jsDelivr CDN fallback to avoid local WebAssembly file requirements
    cachedPyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/"
    });
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
      
      // Install required packages on-demand via micropip
      if (packages && packages.length > 0) {
        await py.loadPackage("micropip");
        const micropip = await py.pyimport("micropip");
        const cleanPackages = packages.filter((p: any) => typeof p === 'string' && p.trim().length > 0);
        if (cleanPackages.length > 0) {
          await micropip.install(cleanPackages);
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
          
          // Loads local Pyodide WebAssembly binaries
          const py = await loadPyodide();
          
          // Install required packages on-demand via micropip
          if (packages && packages.length > 0) {
            await py.loadPackage("micropip");
            const micropip = await py.pyimport("micropip");
            const cleanPackages = packages.filter(p => typeof p === 'string' && p.trim().length > 0);
            if (cleanPackages.length > 0) {
              await micropip.install(cleanPackages);
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

