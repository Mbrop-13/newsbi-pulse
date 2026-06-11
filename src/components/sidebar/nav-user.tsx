"use client";

import { useState, useEffect } from "react"
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  Moon,
  Sun,
  Crown,
  ArrowRight,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"
import Link from "next/link"
import { ViewSettingsDialog } from "@/components/view-settings-dialog"
import { useDiamondStore } from "@/lib/stores/diamond-store"

function getInitials(name: string, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "U"
}

function PlanBadge({ tier }: { tier: string }) {
  if (tier === "ultra" || tier === "admin") {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-300/50 dark:border-amber-500/20 shadow-sm shrink-0">
        <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
        <span className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">{tier}</span>
      </div>
    )
  }
  if (tier === "pro" || tier === "max") {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200/50 dark:border-blue-500/20 shadow-sm shrink-0">
        <Crown className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
        <span className="text-[9px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">{tier}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-sm shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
      <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">Free</span>
    </div>
  )
}

export function NavUser() {
  const { isMobile, state } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const displayName = user?.name || "User"
  const displayEmail = user?.email || ""
  const avatarSrc = user?.avatar

  const { balance, loadDiamonds } = useDiamondStore()

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      loadDiamonds(user.id)
    }
  }, [mounted, isAuthenticated, user, loadDiamonds])

  const handleSignOut = () => {
    useAuthStore.getState().logout()
    router.push("/")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const userTier = user?.role === "admin" ? "ultra" : (user?.tier || "free")

  return (
    <>
      {mounted && isAuthenticated && userTier === "free" && state === "expanded" && (
        <div className="px-3 py-3 mb-3 mx-2 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/5 flex flex-col gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-blue-500/10">
                <Crown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Plan Gratuito</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Actualiza a Pro para acceder a modelos avanzados y agentes.</p>
          <Link 
            href="/suscripcion"
            className="w-full text-center py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1 mt-1 group-hover:scale-[1.02]"
          >
            <span>Subir de Nivel</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  mounted && isAuthenticated && userTier !== "free" && "ring-2 ring-[#1890FF]"
                )}>
                  <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                  <AvatarFallback className="rounded-full">
                    {mounted ? getInitials(displayName, displayEmail) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-semibold">{mounted ? displayName : "Usuario"}</span>
                    {mounted && isAuthenticated && <PlanBadge tier={userTier} />}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{mounted ? displayEmail : ""}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="top"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center justify-between px-1 py-1.5 text-left text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      mounted && isAuthenticated && userTier !== "free" && "ring-2 ring-[#1890FF]"
                    )}>
                      <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                      <AvatarFallback className="rounded-full">
                        {mounted ? getInitials(displayName, displayEmail) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-semibold">{mounted ? displayName : "Usuario"}</span>
                        {mounted && isAuthenticated && <PlanBadge tier={userTier} />}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{mounted ? displayEmail : ""}</span>
                    </div>
                  </div>
                  {/* Diamond Oval Badge */}
                  {mounted && isAuthenticated && (
                    <Link href="/mis-diamantes" className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1890FF]/15 dark:to-indigo-500/15 border border-blue-100/50 dark:border-blue-900/50 hover:opacity-90 transition-all shrink-0">
                      <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none">
                        <img 
                          src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-1.png?v=1774402513" 
                          alt="Diamond" 
                          className="absolute w-12 h-12 max-w-none object-contain"
                        />
                      </div>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-200">{balance}</span>
                    </Link>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/suscripcion")}>
                <Zap className="mr-2 h-4 w-4 text-[#1890FF]" />
                {userTier === "free" ? "Suscribirse" : userTier === "ultra" ? "Gestionar Plan" : "Subir de nivel"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => {
                e.preventDefault();
                setSettingsOpen(true);
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Modo claro" : "Modo oscuro"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ViewSettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
