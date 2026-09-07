"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { getCleanPathname } from "@/lib/utils";
import {
  LayoutDashboard,
  Newspaper,
  PenSquare,
  Terminal,
  ChevronLeft,
  Menu,
  Moon,
  Sun,
  Headphones,
  Megaphone,
  Users,
  Activity,
} from "lucide-react";

const NAV_SECTIONS: {
  title: string;
  items: { href: string; label: string; icon: typeof Users; exact?: boolean }[];
}[] = [
  {
    title: "Producto",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
      { href: "/admin/marketing", label: "Marketing & MRR", icon: Megaphone },
      { href: "/admin/soporte", label: "Soporte", icon: Headphones },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/admin/logs", label: "AI Logs", icon: Terminal }],
  },
  {
    title: "Contenido",
    items: [
      { href: "/admin/noticias", label: "Noticias", icon: Newspaper },
      { href: "/admin/noticias/crear", label: "Crear artículo", icon: PenSquare },
    ],
  },
];

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const rawPathname = usePathname();
  const pathname = getCleanPathname(rawPathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-gray-100 flex transition-colors">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-sm dark:shadow-none"
          >
            <div className="p-6 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sm text-slate-900 dark:text-white">
                    Maverlang Admin
                  </h1>
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 truncate max-w-[150px]">
                    {email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
              {NAV_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-600">
                    {section.title}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href ||
                          (item.href !== "/admin" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm dark:shadow-none"
                              : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-white/5 space-y-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Volver al sitio
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div
        className="flex-1 transition-all duration-200 min-w-0"
        style={{ marginLeft: sidebarOpen ? 260 : 0 }}
      >
        <header className="sticky top-0 z-40 h-14 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 transition-colors"
              title="Alternar Tema"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-green-400 animate-pulse" />
            Admin
          </div>
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
