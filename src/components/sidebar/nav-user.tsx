"use client";

import { useState, useEffect } from "react"
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

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

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                  <AvatarFallback className="rounded-lg">
                    {mounted ? getInitials(displayName, displayEmail) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-medium">{mounted ? displayName : "Usuario"}</span>
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
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                      <AvatarFallback className="rounded-lg">
                        {mounted ? getInitials(displayName, displayEmail) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-medium">{mounted ? displayName : "Usuario"}</span>
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
              <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
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

      {settingsOpen && (
        <ViewSettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  )
}
