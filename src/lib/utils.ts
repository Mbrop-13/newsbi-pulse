import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;

  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + "…";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    tech: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    technology: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    business: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    politics: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    chile: "bg-red-500/10 text-red-400 border-red-500/20",
    world: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    science: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    sports: "bg-green-500/10 text-green-400 border-green-500/20",
    entertainment: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };
  return colors[category.toLowerCase()] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}
