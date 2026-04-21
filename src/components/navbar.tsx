"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, LogIn, ChevronDown, User, Headphones, Filter, ArrowLeft, Bot, Sparkles, Layers, Settings, X, Check, Settings2, TrendingUp, Landmark, LineChart, Globe, PieChart, Cpu, BookOpen, Briefcase, Scale, Zap, BarChart3 } from "lucide-react";
import { DiamondsButton } from "./diamonds-button";
import { AuthModals } from "./auth-modals";
import { SearchDialog } from "./search-dialog";
import { ViewSettingsDialog } from "./view-settings-dialog";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { usePathname, useRouter } from "next/navigation";
import { useFilterStore } from "@/lib/stores/filter-store";
export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewSettingsOpen, setViewSettingsOpen] = useState(false);
  const [temaSearch, setTemaSearch] = useState("");
  const [filtrosView, setFiltrosView] = useState<"main" | "fuentes">("main");
  const [seccionesOpen, setSeccionesOpen] = useState(false);
  const seccionesTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { availableSources, selectedSources, toggleSource, clearSources } = useFilterStore();
  const [fuenteSearch, setFuenteSearch] = useState("");

  const filteredSources = availableSources.filter(s => 
    s.name.toLowerCase().includes(fuenteSearch.toLowerCase())
  );

  const getFavicon = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  // Auto-hide logic (optional, but keep simple for now)
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const { user, isAuthenticated, setUser } = useAuthStore();
  const { isOpen: authModalOpen, view: authModalView, openModal, closeModal } = useAuthModalStore();
  const toggleAudioSidebar = useAudioPlayerStore((s) => s.toggleSidebar);
  const isAudioOpen = useAudioPlayerStore((s) => s.isOpen);
  const supabase = createClient();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "Usuario",
          avatar: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.user_metadata?.full_name || "U")}&background=1890FF&color=fff`,
        });
      } else {
        setUser(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [supabase, setUser]);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 10);
      setVisible(currentY < lastScrollY.current || currentY < 100);
      lastScrollY.current = currentY;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openAuth = (view: "login" | "register") => {
    openModal(view);
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-300 backdrop-blur-md overflow-visible ${scrolled
            ? "bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm"
            : "bg-white/80 dark:bg-slate-900/80 border-b border-transparent"
          }`}
      >
        <div className="w-full px-6 xl:px-12 h-full flex items-center justify-between gap-4">

          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center gap-3 h-full overflow-visible">
            <Link href={`/`} className="flex items-center hover:opacity-80 transition-opacity h-full overflow-visible">
               <img 
                 src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/freepik__background__94196.png?v=1771922713" 
                 alt="Reclu" 
                 className="h-[84px] w-auto object-contain max-w-none"
               />
            </Link>

          </div>

          {/* Center: Minimal Search Bar + View Settings */}
          <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 ml-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 h-10 flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-full px-4 text-sm text-gray-500 border border-transparent focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] outline-none group shadow-inner"
            >
              <Search className="w-4 h-4 text-[#1890FF] mr-2 flex-shrink-0" />
              <span className="flex-1 text-left placeholder:text-gray-500 truncate">Buscar...</span>
              <kbd className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 ml-2 shrink-0">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <button
              onClick={() => setViewSettingsOpen(true)}
              className="h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-[#1890FF]"
              title="Ajustes de Vista"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right Side Group: Nav Menu + Actions */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Nav Menu */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-600 dark:text-gray-300">

              {/* ASISTENTE WAVE LINK */}
              <Link 
                href="/asistente" 
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <motion.span 
                  animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="bg-[linear-gradient(90deg,#1890FF,#60A5FA,#93C5FD,#60A5FA,#1890FF)] bg-[length:200%_auto] bg-clip-text text-transparent font-bold"
                >
                  Asistente
                </motion.span>
              </Link>

              {/* MERCADOS LINK */}
              <Link 
                href="/mercados" 
                className="flex items-center hover:text-[#1890FF] transition-colors"
              >
                Mercados
              </Link>

              {/* SECCIONES MEGA MENU (replaces Fuentes) */}
              <div 
                className="relative"
                onMouseEnter={() => { if(seccionesTimer.current) clearTimeout(seccionesTimer.current); setSeccionesOpen(true); }}
                onMouseLeave={() => { seccionesTimer.current = setTimeout(() => setSeccionesOpen(false), 200); }}
              >
                <button className="flex items-center gap-1 hover:text-[#1890FF] transition-colors outline-none">
                  Secciones
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${seccionesOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {seccionesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[680px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-6 z-50"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">Explora por Sección</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Navega directamente al contenido que te interesa</p>
                        </div>
                        <Link href="/mercados" onClick={() => setSeccionesOpen(false)} className="text-[11px] font-bold text-[#1890FF] hover:underline flex items-center gap-1">
                          Ver Mercados <TrendingUp className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Sections Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { href: "/", icon: <Zap className="w-5 h-5" />, label: "Principal", desc: "Las noticias más importantes del momento", color: "text-blue-500", bg: "bg-blue-500/10" },
                          { href: "/finanzas", icon: <Landmark className="w-5 h-5" />, label: "Finanzas", desc: "Corporativo, bancos y fusiones globales", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                          { href: "/inversiones", icon: <LineChart className="w-5 h-5" />, label: "Inversiones", desc: "Bolsa, cripto y mercados de capitales", color: "text-amber-500", bg: "bg-amber-500/10" },
                          { href: "/impacto-global", icon: <Globe className="w-5 h-5" />, label: "Impacto Global", desc: "Eventos que afectan economías locales", color: "text-purple-500", bg: "bg-purple-500/10" },
                          { href: "/economia", icon: <PieChart className="w-5 h-5" />, label: "Economía", desc: "Macroeconomía, PIB e indicadores", color: "text-rose-500", bg: "bg-rose-500/10" },
                          { href: "/tech-global", icon: <Cpu className="w-5 h-5" />, label: "Tech Global", desc: "IA, startups, Big Tech y más", color: "text-cyan-500", bg: "bg-cyan-500/10" },
                          { href: "/mundo", icon: <Globe className="w-5 h-5" />, label: "Mundo", desc: "Noticias internacionales en el mapa", color: "text-indigo-500", bg: "bg-indigo-500/10" },
                          { href: "/predicciones", icon: <BarChart3 className="w-5 h-5" />, label: "Predicciones", desc: "Mercados de predicción y probabilidades", color: "text-orange-500", bg: "bg-orange-500/10" },
                          { href: "/asistente", icon: <Bot className="w-5 h-5" />, label: "Asistente IA", desc: "Tu analista personal con inteligencia artificial", color: "text-blue-500", bg: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10" },
                        ].map((section) => (
                          <Link
                            key={section.href}
                            href={section.href}
                            onClick={() => setSeccionesOpen(false)}
                            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                          >
                            <div className={`p-2 rounded-xl ${section.bg} ${section.color} shrink-0 group-hover:scale-110 transition-transform`}>
                              {section.icon}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{section.label}</h4>
                              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mt-0.5">{section.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Bottom Bar */}
                      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <button
                          onClick={() => { setSeccionesOpen(false); setViewSettingsOpen(true); }}
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#1890FF] transition-colors px-3 py-2 rounded-lg hover:bg-[#1890FF]/5"
                        >
                          <Settings2 className="w-3.5 h-3.5" /> Preferencias de Vista
                        </button>
                        <Link
                          href="/suscripcion"
                          onClick={() => setSeccionesOpen(false)}
                          className="flex items-center gap-2 text-xs font-bold text-[#1890FF] bg-[#1890FF]/5 hover:bg-[#1890FF]/10 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Reclu Max
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/predicciones" className="hover:text-[#1890FF] transition-colors flex items-center gap-1">🔮 Predicciones</Link>
            </nav>

            {/* Right: Actions, Theme, Auth */}
            <div className="flex items-center gap-3 sm:gap-4">

            {/* New Headphones Button */}
            <button
              onClick={toggleAudioSidebar}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none ${isAudioOpen
                  ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10"
                }`}
              title="Reclu Radio"
            >
              <Headphones className="w-4 h-4" />
            </button>

            {pathname === '/asistente' && (
              <>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => useAssistantStore.getState().setShowSettings(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Ajustes del Asistente"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}


            {/* Mobile Search Icon */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-[#1890FF]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* AI Chat Button (replaces old theme toggle) */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openModal("login");
                  return;
                }
                useAIChatStore.getState().toggle();
              }}
              className="relative text-purple-500 hover:bg-purple-500/10 p-2 rounded-full transition-colors focus:outline-none group"
              title="R-ai"
            >
              <Sparkles className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white dark:border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Diamonds Reward System Toggle */}
            {mounted && <DiamondsButton />}

            {/* Auth / Avatar */}
            {mounted && isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs font-bold bg-[#1890FF] text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 dark:border-gray-800 shadow-xl p-2 bg-white dark:bg-slate-900">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="py-2 px-3">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{user.name}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{user.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                  <Link href="/profile">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Mi Perfil
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/mis-predicciones">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                      Mis Predicciones
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/suscripcion">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#1890FF] font-medium">
                      Suscripción Premium
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                  {mounted && (
                    <DropdownMenuItem
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {theme === "dark" ? <Sun className="w-4 h-4 mr-2 text-amber-500" /> : <Moon className="w-4 h-4 mr-2 text-indigo-500" />}
                      {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-sm py-2 px-3 cursor-pointer rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : mounted ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => openAuth("login")}
                  className="text-sm font-semibold text-[#1890FF] hover:underline hidden sm:block transition-all"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="bg-[#1890FF] hover:bg-[#1890FF]/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-md shadow-[#1890FF]/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  Registrarse
                </button>
              </div>
            ) : null}

            </div>
          </div>
        </div>
      </motion.header>

      <AuthModals
        isOpen={authModalOpen}
        onClose={closeModal}
        defaultView={authModalView}
      />
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <ViewSettingsDialog
        isOpen={viewSettingsOpen}
        onClose={() => setViewSettingsOpen(false)}
      />
    </>
  );
}
