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
  Sparkles,
  User,
  ArrowUpCircle,
  Download,
  Globe,
  HelpCircle,
  Check,
  Monitor,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"
import { useLanguageStore } from "@/lib/stores/language-store"
import { useTranslation, type TranslationKey } from "@/lib/translations"
import { getCleanPathname } from "@/lib/utils"
import Link from "next/link"
import { ViewSettingsDialog } from "@/components/view-settings-dialog"
import { useDiamondStore } from "@/lib/stores/diamond-store"
import { NotificationBell } from "@/components/notification-bell"

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
  const { isMobile, state, setOpenMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const preference = useLanguageStore((s) => s.preference)
  const setPreference = useLanguageStore((s) => s.setPreference)
  const activeLanguage = useLanguageStore((s) => s.language)
  const { t } = useTranslation(activeLanguage)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"cuenta" | "apariencia" | "comportamiento" | "customize" | "datos" | "soporte">("cuenta")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    useLanguageStore.getState().initializeLanguage()
  }, [])
  
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openModal = useAuthModalStore((s) => s.openModal)
  const displayName = user?.name || (isAuthenticated ? (activeLanguage === "es" ? "Usuario" : "User") : t("guest"))
  const displayEmail = user?.email || ""
  const avatarSrc = user?.avatar

  const handleLanguageChange = (pref: "default" | "es" | "en") => {
    setPreference(pref)
    
    // Determine the target locale to push to URL
    let targetLang: "es" | "en" = "es"
    if (pref === "default") {
      const browserLang = typeof navigator !== "undefined" ? navigator.language : "es";
      targetLang = browserLang.toLowerCase().startsWith("es") ? "es" : "en";
    } else {
      targetLang = pref
    }

    // Rewrite the browser URL
    const rawPath = window.location.pathname
    // Clean it of any es/en prefixes
    const cleanPath = getCleanPathname(rawPath)
    const search = window.location.search
    const newPath = `/${targetLang}${cleanPath === '/' ? '' : cleanPath}${search}`
    
    router.push(newPath)
  }

  const { balance, loadDiamonds } = useDiamondStore()

  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      loadDiamonds(user.id)
    }
  }, [mounted, isAuthenticated, user, loadDiamonds])

  const handleSignOut = () => {
    if (isMobile) setOpenMobile(false)
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
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{t("free_plan")}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{t("pro_upgrade_desc")}</p>
          <Link 
            href="/suscripcion"
            onClick={() => { if (isMobile) setOpenMobile(false) }}
            className="w-full text-center py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1 mt-1 group-hover:scale-[1.02]"
          >
            <span>{t("upgrade_button")}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-0.5 w-full">
        <SidebarMenu className="flex-1 min-w-0">
          <SidebarMenuItem className="list-none">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!justify-center !overflow-visible"
                >
                  <div className="relative shrink-0">
                    <Avatar className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      mounted && isAuthenticated && userTier !== "free" && "ring-[1.5px] ring-black/80 dark:ring-white/80"
                    )}>
                      <AvatarImage src={mounted ? avatarSrc : undefined} alt={mounted ? displayName : "Usuario"} />
                      <AvatarFallback className="rounded-full">
                        {mounted ? getInitials(displayName, displayEmail) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Overlapping Badge for Paid Tiers */}
                    {mounted && isAuthenticated && userTier !== "free" && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-zinc-900 text-[8px] font-extrabold px-1.5 h-[14px] rounded-full border border-white dark:border-zinc-950 shadow-sm leading-none flex items-center justify-center pointer-events-none select-none z-10">
                        {userTier === "ultra" ? "Ultra" : userTier === "max" ? "Max" : userTier === "pro" ? "Pro" : "Admin"}
                      </div>
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate font-semibold">{mounted ? displayName : "Usuario"}</span>
                      {mounted && isAuthenticated && userTier === "free" && <PlanBadge tier={userTier} />}
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-[80]"
                side="top"
                align="end"
                sideOffset={8}
              >
                {/* User email row */}
                <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground/80 font-medium select-none pointer-events-none">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">
                    {mounted ? (isAuthenticated ? displayEmail : t("guest_user")) : ""}
                  </span>
                </div>
                <DropdownMenuSeparator className="bg-border/40" />

                {/* Settings action */}
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsTab("cuenta");
                    setSettingsOpen(true);
                  }}
                  className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{t("all_settings")}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">↑ ^,</span>
                </DropdownMenuItem>

                {/* Subscription plan */}
                <DropdownMenuItem
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    router.push("/suscripcion");
                  }}
                  className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center gap-3 focus:bg-muted focus:text-foreground"
                >
                  <ArrowUpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{t("update_plan")}</span>
                </DropdownMenuItem>

                {/* Install apps */}
                <DropdownMenuItem
                  className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center gap-3 focus:bg-muted focus:text-foreground"
                >
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{t("install_apps")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />

                {/* Appearance submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground data-[state=open]:bg-muted">
                    <div className="flex items-center gap-3 text-left">
                      <Sun className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">{t("appearance")}</span>
                        <span className="text-[10px] text-muted-foreground/70 mt-0.5 font-normal">
                          {theme === "light" ? t("light") : theme === "dark" ? t("dark") : t("system")}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-48 rounded-xl border border-gray-200/50 dark:border-white/5 bg-white dark:bg-zinc-950 p-1 shadow-lg z-[90]">
                      <DropdownMenuItem
                        onClick={() => setTheme("light")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{t("light")}</span>
                        </div>
                        {theme === "light" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setTheme("dark")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{t("dark")}</span>
                        </div>
                        {theme === "dark" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setTheme("system")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{t("system")}</span>
                        </div>
                        {theme === "system" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Language submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground data-[state=open]:bg-muted">
                    <div className="flex items-center gap-3 text-left">
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">{t("language")}</span>
                        <span className="text-[10px] text-muted-foreground/70 mt-0.5 font-normal">
                          {preference === "default" ? t("default") : preference === "en" ? "English" : "Español"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-44 rounded-xl border border-gray-200/50 dark:border-white/5 bg-white dark:bg-zinc-950 p-1 shadow-lg z-[90]">
                      <DropdownMenuItem
                        onClick={() => handleLanguageChange("default")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <span>{t("default")}</span>
                        {preference === "default" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleLanguageChange("en")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <span>English</span>
                        {preference === "en" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleLanguageChange("es")}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground"
                      >
                        <span>Español</span>
                        {preference === "es" && <Check className="h-3.5 w-3.5 text-teal-650 dark:text-teal-400 shrink-0" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Help submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center justify-between focus:bg-muted focus:text-foreground data-[state=open]:bg-muted">
                    <div className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-[13px] font-medium">{t("help")}</span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-44 rounded-xl border border-gray-200/50 dark:border-white/5 bg-white dark:bg-zinc-950 p-1 shadow-lg z-[90]">
                      <DropdownMenuItem
                        onClick={() => { if (isMobile) setOpenMobile(false); router.push("/documentacion"); }}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer focus:bg-muted focus:text-foreground"
                      >
                        <span>Documentación</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                          setSettingsTab("soporte");
                          setSettingsOpen(true);
                        }}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer focus:bg-muted focus:text-foreground"
                      >
                        <span>Soporte</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { if (isMobile) setOpenMobile(false); router.push("/comunidad"); }}
                        className="text-xs py-1.5 px-2.5 rounded-lg cursor-pointer focus:bg-muted focus:text-foreground"
                      >
                        <span>Comunidad</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-border/40" />

                {/* Log out / Register */}
                {isAuthenticated ? (
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center gap-3 text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      openModal("register");
                    }}
                    className="text-[13px] font-medium py-2 px-3 rounded-xl cursor-pointer flex items-center gap-3 text-[#1890FF] hover:bg-[#1890FF]/10 focus:bg-[#1890FF]/10 focus:text-[#1890FF]"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
                    <span>{t("register")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        {state === "expanded" && mounted && isAuthenticated && (
          <div className="shrink-0 pl-0.5 pr-1">
            <NotificationBell />
          </div>
        )}
      </div>

      <ViewSettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} defaultTab={settingsTab} />
    </>
  )
}
