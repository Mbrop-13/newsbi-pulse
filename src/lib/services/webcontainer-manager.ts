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
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.344.0",
    "recharts": "^2.12.2",
    "framer-motion": "^11.0.8",
    "react-icons": "^5.0.1"
  },
  devDependencies: {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.6"
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

export class WebContainerManager {
  private static instance: WebContainerManager | null = null;
  private webcontainer: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  
  public status: "idle" | "booting" | "ready" | "installing" | "running" | "error" = "idle";
  public previewUrl: string | null = null;
  
  private listeners: Set<(status: "idle" | "booting" | "ready" | "installing" | "running" | "error", url: string | null) => void> = new Set();
  private logCallback: ((log: string) => void) | null = null;
  
  private installPromise: Promise<void> | null = null;
  private devServerPromise: Promise<void> | null = null;

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

    if (this.webcontainer) {
      await this.mountProject(files);
      return;
    }

    if (this.bootPromise) {
      await this.bootPromise;
      await this.mountProject(files);
      return;
    }

    this.status = "booting";
    this.notify();
    this.log("Iniciando WebContainer...");

    try {
      this.bootPromise = WebContainer.boot();
      const instance = await this.bootPromise;
      this.webcontainer = instance;
      this.log("WebContainer iniciado con éxito.");
    } catch (err: any) {
      this.status = "error";
      this.notify();
      this.log(`Error al iniciar WebContainer: ${err.message || err}`);
      this.bootPromise = null;
      throw err;
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

  public async install() {
    if (!this.webcontainer) return;
    if (this.installPromise) return this.installPromise;

    this.status = "installing";
    this.notify();
    this.log("Instalando dependencias (pnpm install)...");

    this.installPromise = (async () => {
      const installProcess = await this.webcontainer!.spawn("pnpm", ["install"]);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.log(data);
          },
        })
      );

      const exitCode = await installProcess.exit;
      this.installPromise = null;

      if (exitCode !== 0) {
        this.status = "error";
        this.notify();
        throw new Error(`pnpm install falló con el código de salida ${exitCode}`);
      }
      this.log("Instalación de dependencias completada.");
    })();

    return this.installPromise;
  }

  public async startDevServer() {
    if (!this.webcontainer) return;
    if (this.devServerPromise) return;

    this.log("Iniciando servidor de desarrollo Vite (pnpm run dev)...");

    this.webcontainer.on("server-ready", (port, url) => {
      this.previewUrl = url;
      this.status = "running";
      this.log(`Servidor de desarrollo listo en: ${url}`);
      this.notify();
    });

    this.devServerPromise = (async () => {
      const devProcess = await this.webcontainer!.spawn("pnpm", ["run", "dev"]);
      
      devProcess.output.pipeTo(
        new WritableStream({
          write: (data) => {
            this.log(data);
            
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
          },
        })
      );

      devProcess.exit.then((code) => {
        this.log(`El servidor de desarrollo terminó con el código: ${code}`);
        this.devServerPromise = null;
        this.previewUrl = null;
        if (this.status === "running") {
          this.status = "idle";
          this.notify();
        }
      });
    })();
  }
}
