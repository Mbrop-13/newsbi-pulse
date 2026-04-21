"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  PenSquare,
  Terminal,
  Shield,
  Loader2,
  LogOut,
  ChevronLeft,
  Menu,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/noticias", label: "Noticias", icon: Newspaper },
  { href: "/admin/predicciones", label: "Predicciones", icon: TrendingUp },
  { href: "/admin/noticias/crear", label: "Crear Artículo", icon: PenSquare },
  { href: "/admin/logs", label: "AI Logs", icon: Terminal },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/verify");
        const data = await res.json();
        if (!data.isAdmin) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        setEmail(data.email || "");
      } catch {
        router.push("/");
      }
    }
    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm font-mono">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-100 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 z-50 bg-[#0F172A] border-r border-white/5 flex flex-col overflow-hidden"
          >
            {/* Brand */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sm text-white">Reclu Admin</h1>
                  <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 space-y-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Volver al sitio
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div
        className="flex-1 transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? 260 : 0 }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-14 bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Sistema Activo
          </div>
        </header>

        {/* Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
