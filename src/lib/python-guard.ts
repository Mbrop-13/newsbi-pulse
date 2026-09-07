const MAX_SCRIPT_BYTES = 50_000;
const MAX_PACKAGES = 10;

const FORBIDDEN_PACKAGES = new Set([
  "micropip",
  "urllib3",
  "requests",
  "httpx",
  "aiohttp",
  "socket",
  "subprocess",
  "ctypes",
  "pty",
  "shutil",
  "os",
  "sys",
]);

const PACKAGE_ALLOWLIST = new Set([
  "numpy",
  "pandas",
  "matplotlib",
  "scipy",
  "sympy",
  "statistics",
  "math",
  "datetime",
  "json",
  "re",
  "random",
  "collections",
  "itertools",
]);

const ESCAPE_PATTERNS = [
  /\bimport\s+os\b/,
  /\bimport\s+subprocess\b/,
  /\bimport\s+socket\b/,
  /\bimport\s+ctypes\b/,
  /\bimport\s+pty\b/,
  /\bimport\s+shutil\b/,
  /__import__/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bos\.system\b/,
  /\bpty\./,
  /\bctypes\./,
  /\bsocket\./,
  /\b__builtins__\b/,
  /\bgetattr\s*\(\s*__builtins__/,
  /\bglobals\s*\(\s*\)\s*\[/,
  /\bcompile\s*\(/,
  /\bopen\s*\(\s*['"][a-zA-Z]:/,
];

function normalizePackageName(pkg: string): string {
  return pkg
    .replace(/\[.*\]/g, "")
    .split(/[<>=!~;, ]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

export function assertSafePython(
  script: string,
  packages: string[] = []
): { ok: true; packages: string[] } | { ok: false; error: string } {
  if (typeof script !== "string" || script.length === 0) {
    return { ok: false, error: "Script vacío." };
  }
  if (script.length > MAX_SCRIPT_BYTES) {
    return { ok: false, error: "Script demasiado grande." };
  }
  if (packages.length > MAX_PACKAGES) {
    return { ok: false, error: "Demasiados paquetes." };
  }

  const normalized: string[] = [];
  for (const pkg of packages) {
    const name = normalizePackageName(String(pkg));
    if (!name) return { ok: false, error: "Nombre de paquete inválido." };
    if (FORBIDDEN_PACKAGES.has(name)) {
      return { ok: false, error: `Paquete no permitido: ${name}` };
    }
    if (!PACKAGE_ALLOWLIST.has(name)) {
      return { ok: false, error: `Paquete no autorizado: ${name}.` };
    }
    normalized.push(name);
  }

  if (ESCAPE_PATTERNS.some((re) => re.test(script))) {
    return { ok: false, error: "El script contiene operaciones no permitidas." };
  }

  return { ok: true, packages: normalized };
}
