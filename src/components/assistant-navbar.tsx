"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, Headphones, Settings, X, ChevronDown, ChevronRight, User, Layers, ArrowLeft, Bot } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";

export function AssistantNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // Just visual state for now
  const [prefView, setPrefView] = useState<"main" | string>("main");
  
  const { user, isAuthenticated, setUser } = useAuthStore();
  const toggleAudioSidebar = useAudioPlayerStore((s) => s.toggleSidebar);
  const isAudioOpen = useAudioPlayerStore((s) => s.isOpen);
  
  const { topics, tickers, removeTopic, removeTicker, resetSetup, setShowPreferences, setShowSettings } = useAssistantStore();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-300 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
      <div className="w-full px-6 xl:px-12 h-full flex items-center justify-between gap-4">

        {/* Left: Logo + Preferencias */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
             <span className="font-bold text-xl tracking-tight text-[#1890FF]">ProgramBI</span>
          </Link>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />

          {/* Preferencias Button */}
          <button 
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors outline-none border border-transparent hover:border-gray-200 dark:hover:border-white/10 group"
          >
            <Layers className="w-4 h-4 text-[#1890FF]" />
            Preferencias
          </button>
        </div>

        {/* Center: Assistant Search Bar (Chats Anteriores) */}
        <div className="flex-1 max-w-xl xl:max-w-3xl hidden md:flex items-center justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full h-10 flex items-center bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors rounded-full px-4 text-sm text-gray-500 border border-transparent focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] outline-none shadow-inner group"
          >
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <span className="flex-1 text-left placeholder:text-gray-500">Buscar en tus chats anteriores...</span>
            <kbd className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-xs">⌘</span>F
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

          {/* Assistant Config Gear */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10 shadow-sm"
            title="Ajustes del Asistente"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Audio Button */}
          <button
            onClick={toggleAudioSidebar}
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none ${isAudioOpen
                ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/30"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-[#1890FF] hover:bg-[#1890FF]/10"
              }`}
            title="NewsBI Radio"
          >
            <Headphones className="w-4 h-4" />
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 dark:border-gray-800 shadow-xl p-2 bg-white dark:bg-slate-900 mt-2">
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
            <div className="flex items-center gap-2">
               {/* Login placeholder if theoretically not matched */}
            </div>
          ) : null}

        </div>
      </div>
    </header>
  );
}
