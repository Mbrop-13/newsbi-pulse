import { useAuthStore } from "../stores/auth-store";

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

async function loadPyodideInstance() {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Dynamic import to prevent webpack/next.js bundling errors with node wasm binaries
      const { loadPyodide } = await import("pyodide");
      const instance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
      });
      pyodideInstance = instance;
      return instance;
    } catch (err) {
      console.error("[Pyodide Sandbox] Failed to load Pyodide:", err);
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

export interface PythonExecutionResult {
  success: boolean;
  output: any;
  stdout: string;
  stderr: string | null;
  durationMs: number;
}

/**
 * Executes Python script in a WebAssembly sandbox
 */
export async function runPythonCode(
  script: string,
  context: Record<string, any> = {},
  packages: string[] = []
): Promise<PythonExecutionResult> {
  const t0 = Date.now();
  let stdoutBuffer = "";
  let stderrBuffer = "";

  try {
    const py = await loadPyodideInstance();
    if (!py) {
      throw new Error("Pyodide runtime is not loaded");
    }

    // Install required packages on demand (micropip)
    if (packages && packages.length > 0) {
      await py.loadPackage("micropip");
      const micropip = await py.pyimport("micropip");
      // filter valid package names
      const cleanPackages = packages.filter(p => typeof p === 'string' && p.trim().length > 0);
      if (cleanPackages.length > 0) {
        await micropip.install(cleanPackages);
      }
    }

    // Set stdout & stderr capture
    py.setStdout({
      write: (text: string) => {
        stdoutBuffer += text;
        return text.length;
      },
    });

    py.setStderr({
      write: (text: string) => {
        stderrBuffer += text;
        return text.length;
      },
    });

    // Prepare global scope variables
    const locals = py.toPy(context);

    // Execute python code
    const rawResult = await py.runPythonAsync(script, { locals });
    
    let output: any = null;
    if (rawResult) {
      if (typeof rawResult.toJs === "function") {
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
      durationMs,
    };
  } catch (error: any) {
    const durationMs = Date.now() - t0;
    console.error("[Pyodide Sandbox] Script execution failed:", error);
    return {
      success: false,
      output: null,
      stdout: stdoutBuffer,
      stderr: stderrBuffer || error.message || String(error),
      durationMs,
    };
  }
}
