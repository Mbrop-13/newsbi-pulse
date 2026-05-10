"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, LogIn, ChevronDown, User, Headphones, Filter, ArrowLeft, Bot, Sparkles, Layers, Settings, X, Check, Settings2, TrendingUp, Landmark, LineChart, Globe, PieChart, Cpu, BookOpen, Briefcase, Scale, Zap, BarChart3, Crown } from "lucide-react";
import { DiamondsButton } from "@/components/diamonds-button";
import { NotificationBell } from "@/components/notification-bell";
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

  const { user, isAuthenticated } = useAuthStore();
  const { isOpen: authModalOpen, view: authModalView, openModal, closeModal } = useAuthModalStore();
  const toggleAudioSidebar = useAudioPlayerStore((s) => s.toggleSidebar);
  const isAudioOpen = useAudioPlayerStore((s) => s.isOpen);
  const supabase = createClient();

  const router = useRouter();
  const pathname = usePathname();

  // Auth state is now managed globally by AuthSync component

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

    const handleOpenSearch = () => setSearchOpen(true);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
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
        <div className="w-full px-3 md:px-6 xl:px-12 h-full flex items-center justify-between gap-2 md:gap-4">

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

          {/* Center: Minimal Search Bar */}
          <div className="flex-1 max-w-sm hidden md:flex items-center ml-2">
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
          </div>

          {/* Right Side Group: Nav Menu + Actions */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Nav Menu */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-gray-600 dark:text-gray-300">

              {/* PORTAFOLIO LINK */}
              <Link 
                href="/portafolio" 
                className="flex items-center hover:text-[#1890FF] transition-colors"
              >
                Portafolio
              </Link>

              {/* AI LINK */}
              <Link 
                href="/ai" 
                className="flex items-center hover:text-[#1890FF] transition-colors"
              >
                AI
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
                        <Link href="/portafolio" onClick={() => setSeccionesOpen(false)} className="text-[11px] font-bold text-[#1890FF] hover:underline flex items-center gap-1">
                          Ver Portafolio <TrendingUp className="w-3 h-3" />
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
                          { href: "/portafolio", icon: <LineChart className="w-5 h-5" />, label: "Portafolio", desc: "Tus inversiones e indicadores clave", color: "text-blue-500", bg: "bg-blue-500/10" },
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
                      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
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

              {/* SUSCRIPCIONES LINK */}
              <Link 
                href="/suscripcion" 
                className="flex items-center gap-1.5 text-[#1890FF] hover:text-[#0052CC] font-bold transition-all hover:scale-105"
              >
                <Crown className="w-4 h-4" />
                Suscripciones
              </Link>

              <Link href="/mundo" className="hover:text-[#1890FF] transition-colors flex items-center gap-1">🌍 Mundo</Link>
            </nav>

            {/* Right: Actions, Theme, Auth */}
            <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">

            {/* New Headphones Button */}
            {isAuthenticated && (
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
            )}

            {/* Mobile Search Icon */}
            <button
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10 transition-colors"
              onClick={() => setSearchOpen(true)}
              title="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>

            {pathname === '/ai' && (
              <>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => useAssistantStore.getState().setShowSettings(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Ajustes de AI"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}




            {/* Notification Bell */}
            {mounted && isAuthenticated && (
              <div className="hidden md:block">
                <NotificationBell />
              </div>
            )}

            {/* AI Chat Button */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openModal("login");
                  return;
                }
                useAIChatStore.getState().toggle();
              }}
              className="hidden md:flex relative text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10 p-2 rounded-full transition-colors focus:outline-none group items-center justify-center"
              title="AI"
            >
              <Sparkles className="w-5 h-5" />
              {/* Notification Indicator (Blue Blinking) */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#1890FF] rounded-full shadow-[0_0_8px_rgba(24,144,255,0.8)] animate-pulse" />
            </button>

            {/* Diamonds Reward System Toggle */}
            {mounted && isAuthenticated && <DiamondsButton />}

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
                  <Link href="/portafolio">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                      Mi Portafolio
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/configuracion">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Settings className="w-4 h-4 mr-2 text-gray-500" />
                      Configuración
                    </DropdownMenuItem>
                  </Link>
                  <div className="px-2 py-1">
                    <Link href="/suscripcion">
                      <DropdownMenuItem className="text-sm py-2 px-4 cursor-pointer rounded-full transition-all duration-300 text-[#1890FF] font-bold bg-[#1890FF]/10 hover:bg-[#1890FF]/20 hover:scale-[1.02] flex items-center justify-center gap-2 group relative overflow-hidden shadow-[0_0_15px_-3px_rgba(24,144,255,0.3)]">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                        <Crown className="w-4 h-4 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-300" />
                        Suscripción Premium
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                  
                  {/* Preferences directly opens the ViewSettingsDialog */}
                  <DropdownMenuItem 
                    onClick={() => setViewSettingsOpen(true)}
                    className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings2 className="w-4 h-4 mr-2 text-gray-500" />
                    Preferencias
                  </DropdownMenuItem>
                  
                  {/* Support opens the new Support route */}
                  <Link href="/soporte">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Headphones className="w-4 h-4 mr-2 text-gray-500" />
                      Soporte
                    </DropdownMenuItem>
                  </Link>

                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1 md:hidden" />
                  <div className="md:hidden px-1">
                    <NotificationBell asMenuItem />
                  </div>
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
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => openAuth("login")}
                  className="text-[13px] sm:text-sm font-semibold text-[#1890FF] hover:underline transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={() => openAuth("register")}
                  className="bg-[#1890FF] hover:bg-[#1890FF]/90 text-white text-[13px] sm:text-sm font-semibold px-3.5 py-2 sm:px-4 sm:py-2 rounded-full transition-all shadow-md shadow-[#1890FF]/20 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
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
