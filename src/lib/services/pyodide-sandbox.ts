import { Worker } from "worker_threads";

export interface PythonExecutionResult {
  success: boolean;
  output: any;
  stdout: string;
  stderr: string | null;
  durationMs: number;
}

/**
 * Executes Python script in an isolated WebAssembly sandbox running in a worker thread.
 * Spawning a separate worker thread guarantees that infinite loops or heavy computations
 * do not block the main event loop, and ensures complete isolation between scripts.
 */
export async function runPythonCode(
  script: string,
  context: Record<string, any> = {},
  packages: string[] = [],
  timeoutMs: number = 15000 // 15-second default timeout
): Promise<PythonExecutionResult> {
  const t0 = Date.now();

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
          const { loadPyodide } = require('pyodide');
          const { script, context, packages } = workerData;
          
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

    const worker = new Worker(workerCode, {
      eval: true,
      workerData: { script, context, packages },
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
  });
}
