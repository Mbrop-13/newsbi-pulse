import { WebContainer } from "@webcontainer/api";

// Helper to clean paths (e.g., /App.tsx -> App.tsx)
export function cleanPath(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

const DEFAULT_PACKAGE_JSON = {
  name: "maverlang-preview",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    preview: "vite preview"
  },
  dependencies: {
    // Alineado a React 19 (mismo major que la app host) para que el código
    // generado por la IA no use APIs que rompan en la preview.
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.2",
    "framer-motion": "^11.0.8",
    "react-icons": "^5.0.1"
  },
  devDependencies: {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.10"
  }
};

const DEFAULT_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    }
  },
});
`;

const DEFAULT_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Node",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`;

const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maverlang Preview</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" crossorigin></script>
    <style>
      .maverlang-inspector-hover {
        outline: 2px solid #3b82f6 !important;
        outline-offset: -2px !important;
        cursor: crosshair !important;
        box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.1s !important;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
    <script>
      let isInspectorActive = false;

      window.addEventListener('error', (event) => {
        if (typeof window !== 'undefined' && window.parent) {
          window.parent.postMessage({
            type: 'MAVERLANG_PREVIEW_ERROR',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error ? event.error.stack || event.error.message : null
          }, '*');
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (typeof window !== 'undefined' && window.parent) {
          window.parent.postMessage({
            type: 'MAVERLANG_PREVIEW_ERROR',
            message: event.reason ? event.reason.message || String(event.reason) : 'Unhandled rejection',
            error: event.reason ? event.reason.stack : null
          }, '*');
        }
      });
      
      window.addEventListener('message', (e) => {
        if (e.data?.type === 'TOGGLE_INSPECTOR') {
          isInspectorActive = e.data.active;
          if (!isInspectorActive) {
            document.querySelectorAll('.maverlang-inspector-hover').forEach(el => el.classList.remove('maverlang-inspector-hover'));
          }
        }
      });

      document.addEventListener('mouseover', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target !== document.body && e.target !== document.documentElement) {
          e.target.classList.add('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (!isInspectorActive) return;
        e.stopPropagation();
        if (e.target && e.target.classList) {
          e.target.classList.remove('maverlang-inspector-hover');
        }
      }, true);

      document.addEventListener('click', (e) => {
        if (!isInspectorActive) return;
        e.preventDefault();
        e.stopPropagation();
        
        const el = e.target;
        if (!el || el === document.body || el === document.documentElement) return;

        el.classList.remove('maverlang-inspector-hover');
        
        const clone = el.cloneNode(false);
        let innerText = el.innerText || '';
        if (innerText.length > 50) innerText = innerText.substring(0, 50) + '...';
        if (innerText) clone.innerText = innerText;
        
        window.parent.postMessage({
          type: 'MAVERLANG_ELEMENT_CLICKED',
          elementHtml: clone.outerHTML,
          tagName: el.tagName,
          className: el.className || ''
        }, '*');
        
        isInspectorActive = false;
        window.parent.postMessage({ type: 'MAVERLANG_INSPECTOR_DISABLED' }, '*');
      }, true);
    </script>
  </body>
</html>
`;

// Helper to build the WebContainer file tree structure recursively
function buildFileTree(files: Record<string, { code: string }>) {
  const root: any = {};

  for (const [path, fileObj] of Object.entries(files)) {
    const relativePath = cleanPath(path);
    const parts = relativePath.split("/").filter(Boolean);
    
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        current[part] = {
          file: {
            contents: fileObj.code,
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    }
  }

  return root;
}

// Comprueba si el documento host tiene el aislamiento cross-origin que
// WebContainer.boot() necesita (SharedArrayBuffer). Devuelve null si todo OK,
// o un mensaje legible si falta. Exportado para poder diagnosticar antes del boot.
export function checkCrossOriginIsolation(): string | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    crossOriginIsolated?: boolean;
    SharedArrayBuffer?: unknown;
    isSecureContext?: boolean;
  };

  if (!w.isSecureContext) {
    return "El WebContainer requiere un contexto seguro (HTTPS o localhost). La página actual no lo es.";
  }
  if (typeof w.SharedArrayBuffer === "undefined") {
    return "SharedArrayBuffer no está disponible. Falta el aislamiento cross-origin: revisa que los headers COOP/COEP lleguen a la ruta del builder (/ai/*).";
  }
  if (w.crossOriginIsolated === false) {
    return "crossOriginIsolated === false. WebContainer necesita COEP (Cross-Origin-Embedder-Policy) y COOP (Cross-Origin-Opener-Policy) en la página host.";
  }
  return null;
}

export class WebContainerManager {
  private static instance: WebContainerManager | null = null;
  private webcontainer: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;

  public status: "idle" | "booting" | "ready" | "installing" | "running" | "error" = "idle";
  public previewUrl: string | null = null;
  // Mensaje legible del último error fatal (p. ej. falta SharedArrayBuffer).
  // La UI lo lee para mostrar feedback al usuario en lugar de un loader infinito.
  public previewError: string | null = null;
  
  private listeners: Set<(status: "idle" | "booting" | "ready" | "installing" | "running" | "error", url: string | null) => void> = new Set();
  private logCallback: ((log: string) => void) | null = null;
  
  private installPromise: Promise<void> | null = null;
  private devServerPromise: Promise<void> | null = null;
  private installProcess: any = null;
  private devProcess: any = null;

  public static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  public subscribe(cb: (status: typeof this.status, url: string | null) => void) {
    this.listeners.add(cb);
    cb(this.status, this.previewUrl);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.status, this.previewUrl));
  }

  public setLogCallback(cb: (log: string) => void) {
    this.logCallback = cb;
  }

  private log(message: string) {
    console.log(`[WebContainer] ${message}`);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  public async boot(files: Record<string, { code: string }>) {
    if (typeof window === "undefined") return;

    // ── Diagnóstico previo: WebContainer.boot() necesita SharedArrayBuffer ──
    // Si no hay aislamiento cross-origin, abortar con mensaje claro en lugar de
    // dejar que boot() lance un error crudo y la preview se quede en blanco.
    const isolationError = checkCrossOriginIsolation();
    if (isolationError) {
      this.status = "error";
      this.previewError = isolationError;
      this.notify();
      this.log(`[DIAGNÓSTICO] ${isolationError}`);
      return;
    }

    if (this.webcontainer) {
      if (this.status === "error" || this.status === "idle") {
        this.log("WebContainer ya existe pero no está en ejecución. Reintentando...");
        await this.mountProject(files);
        await this.install();
        await this.startDevServer();
      } else {
        await this.mountProject(files);
      }
      return;
    }

    if (this.bootPromise) {
      await this.bootPromise;
      await this.mountProject(files);
      return;
    }

    this.status = "booting";
    this.previewError = null;
    this.notify();
    this.log("Iniciando WebContainer...");

    // Boot con 1 reintento (backoff de 1s). StackBlitz recomienda reintentar
    // porque el primer boot puede fallar por causas transitorias.
    try {
      this.bootPromise = WebContainer.boot();
      const instance = await this.bootPromise;
      this.webcontainer = instance;
      this.log("WebContainer iniciado con éxito.");
    } catch (err: any) {
      this.bootPromise = null;
      this.log(`Primer intento de boot falló: ${err.message || err}. Reintentando en 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
      try {
        this.bootPromise = WebContainer.boot();
        const instance = await this.bootPromise;
        this.webcontainer = instance;
        this.log("WebContainer iniciado con éxito (tras reintento).");
      } catch (err2: any) {
        this.status = "error";
        this.previewError = `No se pudo iniciar el WebContainer: ${err2.message || err2}`;
        this.notify();
        this.log(`Error al iniciar WebContainer: ${err2.message || err2}`);
        this.bootPromise = null;
        throw err2;
      }
    }

    await this.mountProject(files);
    await this.install();
    await this.startDevServer();
  }

  public async mountProject(files: Record<string, { code: string }>) {
    if (!this.webcontainer) return;
    this.log("Montando archivos del proyecto...");
    
    const tree = buildFileTree(files);

    // Inject package.json, vite.config.ts, tsconfig.json, index.html if missing
    if (!tree["package.json"]) {
      tree["package.json"] = {
        file: {
          contents: JSON.stringify(DEFAULT_PACKAGE_JSON, null, 2),
        },
      };
    }
    if (!tree["vite.config.ts"] && !tree["vite.config.js"]) {
      tree["vite.config.ts"] = {
        file: {
          contents: DEFAULT_VITE_CONFIG,
        },
      };
    }
    if (!tree["tsconfig.json"]) {
      tree["tsconfig.json"] = {
        file: {
          contents: DEFAULT_TSCONFIG,
        },
      };
    }
    if (!tree["index.html"]) {
      tree["index.html"] = {
        file: {
          contents: DEFAULT_INDEX_HTML,
        },
      };
    }

    await this.webcontainer.mount(tree);
    this.log("Archivos del proyecto montados con éxito.");

    // Snapshot inicial: tras un mount completo, los archivos ya están en el FS.
    // Resetear para que la siguiente syncFiles() solo escriba los cambios reales.
    this.resetSyncSnapshot(files);
  }

  public async writeFile(path: string, content: string) {
    if (!this.webcontainer) return;
    const relPath = cleanPath(path);

    const parts = relPath.split("/");
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join("/");
      await this.webcontainer.fs.mkdir(dirPath, { recursive: true });
    }

    await this.webcontainer.fs.writeFile(relPath, content);
    this.log(`Archivo actualizado: ${relPath}`);
  }

  /**
   * Sincroniza archivos al WebContainer de forma INCREMENTAL: solo escribe
   * los archivos que cambiaron respecto a `lastSyncedFiles` usando fs.writeFile.
   *
   * Esto evita el "re-mount storm" (llamar a mount() en cada cambio), que
   * reemplaza todo el sistema de archivos, reinicia Vite y pierde el HMR,
   * dejando a menudo la preview en blanco o colgada.
   *
   * Usar syncFiles() cuando el manager ya está "running" y solo cambiaron
   * archivos. mountProject() queda reservado para el boot inicial y el restart.
   */
  private lastSyncedFiles: Record<string, { code: string }> = {};

  public async syncFiles(files: Record<string, { code: string }>) {
    if (!this.webcontainer) return;

    // Detectar archivos nuevos o modificados
    const writes: Promise<void>[] = [];
    for (const [path, { code }] of Object.entries(files)) {
      const prev = this.lastSyncedFiles[path];
      if (!prev || prev.code !== code) {
        writes.push(
          (async () => {
            const relPath = cleanPath(path);
            const parts = relPath.split("/");
            if (parts.length > 1) {
              const dirPath = parts.slice(0, -1).join("/");
              await this.webcontainer!.fs.mkdir(dirPath, { recursive: true });
            }
            await this.webcontainer!.fs.writeFile(relPath, code);
            this.log(`[syncFiles] Actualizado: ${relPath}`);
          })()
        );
      }
    }

    if (writes.length > 0) {
      await Promise.all(writes);
    }

    this.lastSyncedFiles = { ...files };
  }

  /** Resetea el snapshot incremental (usar tras mount completo o restart). */
  public resetSyncSnapshot(files: Record<string, { code: string }>) {
    this.lastSyncedFiles = { ...files };
  }

  public async destroyProcesses() {
    if (this.devProcess) {
      try {
        this.log("Finalizando proceso de desarrollo Vite...");
        await this.devProcess.kill();
      } catch (e) {
        console.error("Error al finalizar devProcess:", e);
      }
      this.devProcess = null;
    }
    if (this.installProcess) {
      try {
        this.log("Finalizando proceso de instalación npm...");
        await this.installProcess.kill();
      } catch (e) {
        console.error("Error al finalizar installProcess:", e);
      }
      this.installProcess = null;
    }
    this.installPromise = null;
    this.devServerPromise = null;
  }

  public async restart(files: Record<string, { code: string }>, forceFullWipe = false) {
    this.log(`Reiniciando WebContainer (forceFullWipe: ${forceFullWipe})...`);
    this.status = "booting";
    this.notify();

    // 1. Detener procesos activos
    await this.destroyProcesses();

    // 2. Limpiar directorio (excepto node_modules a menos que sea forzado)
    if (this.webcontainer) {
      try {
        const items = await this.webcontainer.fs.readdir(".", { withFileTypes: true });
        for (const item of items) {
          if (item.name === "node_modules" && !forceFullWipe) {
            continue;
          }
          if (item.isDirectory()) {
            await this.webcontainer.fs.rm(item.name, { recursive: true, force: true });
          } else {
            await this.webcontainer.fs.rm(item.name, { force: true });
          }
        }
        this.log("Limpieza del espacio de trabajo completada.");
      } catch (err) {
        this.log(`Error durante la limpieza del espacio de trabajo: ${err}`);
      }
    }

    this.previewUrl = null;

    // 3. Montar y volver a ejecutar
    try {
      await this.mountProject(files);
      await this.install();
      await this.startDevServer();
    } catch (err: any) {
      this.status = "error";
      this.notify();
      this.log(`Error durante el reinicio: ${err.message || err}`);
      throw err;
    }
  }

  /**
   * Drena el output de un proceso de WebContainer de forma fiable:
   * - Acumula TODO el texto (para poder mostrarlo si hay error).
   * - Retorna una promesa que se resuelve SOLO cuando el stream se cerró por
   *   completo, evitando el race condition de pipeTo() (que puede abortar el
   *   stream y provocar que npm termine con código de salida 1).
   * - Pasa cada chunk al logCallback y opcionalmente a un callback onChunk.
   */
  private drainOutput(
    process: any,
    onChunk?: (data: string) => void
  ): { done: Promise<string> } {
    let accumulated = "";
    const done = new Promise<string>((resolve) => {
      // Guard: si el proceso no tiene output (caso edge), resolver enseguida.
      if (!process?.output) {
        resolve("");
        return;
      }
      const reader = process.output.getReader();
      const pump = (): Promise<void> =>
        reader.read().then(({ value, done: streamDone }: { value: string; done: boolean }) => {
          if (streamDone) {
            resolve(accumulated);
            return;
          }
          if (value) {
            accumulated += value;
            this.log(value);
            onChunk?.(value);
          }
          return pump();
        });
      pump().catch((err) => {
        this.log(`[drainOutput] error leyendo stream: ${err}`);
        resolve(accumulated);
      });
    });
    return { done };
  }

  public async install() {
    if (!this.webcontainer) return;
    if (this.installPromise) return this.installPromise;

    this.status = "installing";
    this.previewError = null;
    this.notify();
    this.log("Instalando dependencias (npm install)...");

    this.installPromise = this.runInstallWithRetry();

    return this.installPromise;
  }

  /**
   * Ejjecuta npm install con captura completa del output y hasta 2 reintentos.
   * El reintento es clave: el primer install en un WebContainer recién booteado
   * puede fallar transitoriamente (DNS del registry, cold cache, etc.).
   */
  private async runInstallWithRetry(maxAttempts = 3) {
    let lastOutput = "";
    let lastExitCode: number | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const installProcess = await this.webcontainer!.spawn("npm", [
        "install",
        "--prefer-offline",
        "--no-audit",
        "--no-fund"
      ]);
      this.installProcess = installProcess;

      // Drenar el output de forma fiable (esperar a que el stream cierre).
      const { done } = this.drainOutput(installProcess);

      // Esperar AMBAS cosas: que el proceso termine Y que el stream se consuma.
      const [exitCode, output] = await Promise.all([
        installProcess.exit,
        done
      ]);
      this.installProcess = null;
      lastOutput = output;
      lastExitCode = exitCode;

      if (exitCode === 0) {
        this.installPromise = null;
        this.log("Instalación de dependencias completada.");
        return;
      }

      this.log(`npm install intento ${attempt}/${maxAttempts} falló (código ${exitCode}).`);

      // Pequeña pausa antes de reintentar para dejar que el FS se asiente.
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Todos los intentos fallaron: capturar el output real para diagnóstico.
    this.installPromise = null;
    this.status = "error";
    // Extraer las líneas más relevantes del output (errores npm/registry).
    const relevantLines = lastOutput
      .split("\n")
      .filter((line) =>
        /err!|npm error|error|enoent|eacces|eresolve|404|not found|cannot find|failed/i.test(line)
      )
      .slice(-8)
      .join("\n")
      .trim();

    const detail = relevantLines || lastOutput.slice(-800).trim();
    this.previewError =
      `npm install falló (código ${lastExitCode}) tras ${maxAttempts} intentos.\n\n` +
      `Salida de npm:\n${detail || "(sin output capturado)"}`;
    this.notify();
    throw new Error(this.previewError);
  }

  public async startDevServer() {
    if (!this.webcontainer) return;
    if (this.devServerPromise) return;

    this.log("Iniciando servidor de desarrollo Vite (npm run dev)...");

    this.webcontainer.on("server-ready", (port, url) => {
      this.previewUrl = url;
      this.status = "running";
      // El dev server está vivo: limpiar cualquier error previo (p. ej.
      // de un intento anterior que ahora sí funcionó).
      this.previewError = null;
      this.log(`Servidor de desarrollo listo en: ${url}`);
      this.notify();
    });

    this.devServerPromise = (async () => {
      const devProcess = await this.webcontainer!.spawn("npm", ["run", "dev"]);
      this.devProcess = devProcess;

      // Drenar el output de forma fiable (mismo patrón que install).
      const { done } = this.drainOutput(devProcess, (data) => {
        // Catch typical Vite compilation or module resolution errors
        if (
          data.includes("failed to resolve") ||
          data.includes("Error:") ||
          data.includes("SyntaxError:") ||
          data.includes("Internal server error")
        ) {
          if (typeof window !== "undefined") {
            window.postMessage(
              {
                type: "MAVERLANG_COMPILE_ERROR",
                error: data.trim(),
              },
              "*"
            );
          }
        }
      });

      // Cuando el proceso termine (Vite cierra por error o kill), limpiar.
      devProcess.exit.then((code) => {
        this.log(`El servidor de desarrollo terminó con el código: ${code}`);
        this.devProcess = null;
        this.devServerPromise = null;
        this.previewUrl = null;
        if (this.status === "running") {
          this.status = "idle";
          this.notify();
        }
      });

      // Esperar a que el stream se cierre (evita race condition de pipeTo).
      // No esperamos exit aquí porque el dev server es long-running.
      done.catch((err) => {
        this.log(`[startDevServer] stream cerrado: ${err}`);
      });
    })();
  }
}
