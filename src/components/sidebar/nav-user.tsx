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
        <div className="px-3 py-2.5 mb-2.5 mx-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/50 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-200">
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 animate-pulse" />
            <span>Plan Gratuito</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal font-medium">Desbloquea modelos Pro, agentes ilimitados y más beneficios.</p>
          <Link 
            href="/suscripcion"
            className="w-full text-center py-1.5 px-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-[11px] font-black shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-1"
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
                  "h-8 w-8 rounded-lg transition-all",
                  mounted && isAuthenticated && userTier !== "free" && "ring-2 ring-[#1890FF] ring-offset-2 ring-offset-background"
                )}>
                  <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                  <AvatarFallback className="rounded-lg">
                    {mounted ? getInitials(displayName, displayEmail) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-semibold">{mounted ? displayName : "Usuario"}</span>
                    {mounted && isAuthenticated && (
                      <span className={cn(
                        "text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 border",
                        userTier === "pro" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/30",
                        userTier === "max" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/30",
                        userTier === "ultra" && "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
                        userTier === "free" && "bg-gray-100 text-gray-650 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-700/30"
                      )}>
                        {userTier}
                      </span>
                    )}
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
                      "h-8 w-8 rounded-lg transition-all",
                      mounted && isAuthenticated && userTier !== "free" && "ring-2 ring-[#1890FF] ring-offset-2 ring-offset-background"
                    )}>
                      <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                      <AvatarFallback className="rounded-lg">
                        {mounted ? getInitials(displayName, displayEmail) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-semibold">{mounted ? displayName : "Usuario"}</span>
                        {mounted && isAuthenticated && (
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 border",
                            userTier === "pro" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/30",
                            userTier === "max" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/30",
                            userTier === "ultra" && "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
                            userTier === "free" && "bg-gray-150 text-gray-650 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-700/30"
                          )}>
                            {userTier}
                          </span>
                        )}
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
