"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, LogIn, ChevronDown, User, Headphones, Filter, ArrowLeft, Bot, Sparkles, Layers, Settings, X, Check } from "lucide-react";
import { DiamondsButton } from "./diamonds-button";
import { AuthModals } from "./auth-modals";
import { SearchDialog } from "./search-dialog";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { COUNTRIES, getCountry, DEFAULT_COUNTRY } from "@/lib/country-config";
import { usePathname, useRouter } from "next/navigation";
import { useFilterStore } from "@/lib/stores/filter-store";
export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    view: "login" | "register";
  }>({ isOpen: false, view: "login" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [temaSearch, setTemaSearch] = useState("");
  const [filtrosView, setFiltrosView] = useState<"main" | "fuentes">("main");
  
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
  const toggleAudioSidebar = useAudioPlayerStore((s) => s.toggleSidebar);
  const isAudioOpen = useAudioPlayerStore((s) => s.isOpen);
  const supabase = createClient();

  const router = useRouter();
  const pathname = usePathname();
  
  // Extract country from URL
  const pathSegment = pathname?.split('/')[1] || '';
  const countryFromPath = getCountry(pathSegment);
  
  const activeCountrySlug = countryFromPath?.slug || DEFAULT_COUNTRY;
  const activeCountry = getCountry(activeCountrySlug) || getCountry(DEFAULT_COUNTRY)!;

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
    setAuthModal({ isOpen: true, view });
  };

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-300 backdrop-blur-md ${scrolled
            ? "bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm"
            : "bg-white/80 dark:bg-slate-900/80 border-b border-transparent"
          }`}
      >
        <div className="w-full px-6 xl:px-12 h-full flex items-center justify-between gap-4">

          {/* Left: Logo + Country selector */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href={`/${activeCountrySlug}`} className="flex items-center hover:opacity-80 transition-opacity mr-1">
               <span className="font-bold text-xl tracking-tight text-[#1890FF]">ProgramBI</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

            {/* Country flag dropdown — standalone, no conflict */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors outline-none border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <img src={activeCountry.flagUrl} alt={activeCountry.name} className="w-6 h-4 object-cover rounded-[2px] shadow-sm" />
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[220px] rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl p-2 bg-white dark:bg-slate-900 mt-2" align="start" sideOffset={8}>
                <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase px-2 py-1 cursor-default">Seleccionar país</div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1" />
                {COUNTRIES.map(c => (
                  <DropdownMenuItem
                    key={c.code}
                  >
                    <Link
                      href={`/${c.slug}`}
                      className={`cursor-pointer rounded-lg py-2.5 px-3 flex items-center gap-3 transition-colors outline-none ${
                        c.slug === activeCountrySlug
                          ? "bg-[#1890FF]/10 text-[#1890FF] font-semibold focus:bg-[#1890FF]/15 focus:text-[#1890FF]"
                          : "hover:bg-[#1890FF]/10 hover:text-[#1890FF] focus:bg-[#1890FF]/15 focus:text-[#1890FF]"
                      }`}
                    >
                      <img src={c.flagUrl} alt={c.name} className="w-6 h-4 object-cover rounded-[2px] shadow-sm" />
                      <span className="text-sm font-medium">{c.name}</span>
                      {c.slug === activeCountrySlug && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1890FF]" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* New Nav Menu */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-gray-600 dark:text-gray-300 ml-2 mr-auto">

            {/* ASISTENTE WAVE LINK */}
            <Link 
              href="/asistente" 
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openAuth("login");
                }
              }}
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

            {/* TEMAS MEGA MENU REMOVED PER USER REQUEST */}

            {/* FILTROS MEGA MENU */}
            <DropdownMenu onOpenChange={(open) => { if (!open) setFiltrosView("main"); }}>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-[#1890FF] outline-none transition-colors">
                Fuentes
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[320px] rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl p-3 bg-white dark:bg-slate-900 mt-2 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Filtrar por Fuentes</h4>
                  {selectedSources.length > 0 && (
                    <span className="bg-[#1890FF]/10 text-[#1890FF] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedSources.length} seleccionadas
                    </span>
                  )}
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar fuente..."
                    value={fuenteSearch}
                    onChange={(e) => setFuenteSearch(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-[#1890FF] outline-none transition-all"
                  />
                  {fuenteSearch && (
                    <button onClick={() => setFuenteSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 pr-1 flex flex-col gap-1">
                  {filteredSources.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-500">No hay fuentes disponibles.</div>
                  ) : (
                    filteredSources.map((source) => {
                      const isSelected = selectedSources.includes(source.name);
                      const favicon = getFavicon(source.url);
                      return (
                        <DropdownMenuCheckboxItem
                          key={source.name}
                          checked={isSelected}
                          onCheckedChange={() => toggleSource(source.name)}
                          onSelect={(e) => e.preventDefault()}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {favicon ? (
                              <img src={favicon} alt="" className="w-5 h-5 rounded-full bg-white object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10" />
                            )}
                            <span className="truncate max-w-[200px]">{source.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      );
                    })
                  )}
                </div>
                
                {selectedSources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => clearSources()}
                      className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Limpiar selección
                    </button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* RECIENTE LINK REMOVED PER USER REQUEST */}
            <Link href="/mundo" className="hover:text-[#1890FF] transition-colors">Mundo</Link>
          </nav>

          {/* Center: Minimal Search Bar (Shifted to the left) */}
          <div className="flex-1 max-w-sm hidden md:flex items-center justify-start ml-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full h-10 flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-full px-4 text-sm text-gray-500 border border-transparent focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] outline-none group shadow-inner"
            >
              <Search className="w-4 h-4 text-[#1890FF] mr-2" />
              <span className="flex-1 text-left placeholder:text-gray-500">Buscar noticias, temas o fuentes...</span>
              <kbd className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right: Actions, Theme, Auth */}
          <div className="flex items-center gap-3 sm:gap-4 ml-4">

            {/* New Headphones Button */}
            <button
              onClick={toggleAudioSidebar}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none ${isAudioOpen
                  ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10"
                }`}
              title="NewsBI Radio"
            >
              <Headphones className="w-4 h-4" />
            </button>

            {/* Assistant Controls (visible only on /asistente) */}
            {pathname === '/asistente' && (
              <>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => useAssistantStore.getState().setShowPreferences(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF] text-xs font-bold hover:bg-blue-100 dark:hover:bg-[#1890FF]/20 transition-colors"
                  title="Preferencias de IA"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preferencias</span>
                </button>
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

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-[#1890FF] hover:bg-[#1890FF]/10 p-2 rounded-full transition-colors focus:outline-none"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

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
                  <DropdownMenuLabel className="py-2 px-3">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{user.name}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-1">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                  <Link href="/profile">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Mi Perfil
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/profile">
                    <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#1890FF] font-medium">
                      Suscripción Premium
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
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
      </motion.header>

      <AuthModals
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultView={authModal.view}
      />
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
