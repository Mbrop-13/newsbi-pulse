"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageSquarePlus,
  Search,
  Briefcase,
  TrendingUp,
  Newspaper,
  Globe,
  Settings,
  FolderKanban,
  Workflow,
  ArrowLeft,
  MoreHorizontal,
  Image,
  Users,
  Clapperboard,
  Sparkles,
  Trash2,
  EyeOff,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { NavChats } from "@/components/sidebar/nav-chats"
import { SidebarLogo } from "@/components/sidebar/sidebar-logo"
import { SearchDialog } from "@/components/search-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAIChatStore } from "@/lib/stores/ai-chat-store"
import { useBrowserStore } from "@/lib/stores/browser-store"
import { useCanvasStore } from "@/lib/stores/canvas-store"
import { useLanguageStore } from "@/lib/stores/language-store"
import { useTranslation } from "@/lib/translations"
import { cn } from "@/lib/utils"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const clearMessages = useAIChatStore((s) => s.clearMessages)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname() || ""
  const router = useRouter()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const language = useLanguageStore((s) => s.language)
  const { t } = useTranslation(language)

  // Check if we are on the Flow page route
  const isFlowPage = pathname.endsWith("/flow") || pathname.includes("/flow/")

  // Navigation data for main buttons
  const mainButtons = React.useMemo(
    () => [
      {
        title: t("new_chat"),
        url: `/${language}/ai`,
        icon: MessageSquarePlus,
        onClick: () => {
          clearMessages();
          useBrowserStore.getState().clearSession();
          useCanvasStore.getState().closeCanvas();
        },
      },
      {
        title: t("search"),
        url: "#",
        icon: Search,
        isAction: true,
        onClick: () => setSearchOpen(true),
      },
      {
        title: t("projects"),
        url: `/${language}/proyectos`,
        icon: FolderKanban,
      },
      {
        title: t("portfolio"),
        url: `/${language}/portafolio`,
        icon: Briefcase,
      },
      {
        title: t("markets"),
        url: `/${language}/mercados`,
        icon: TrendingUp,
      },
      {
        title: t("news"),
        url: `/${language}/noticias`,
        icon: Newspaper,
      },
      {
        title: t("world"),
        url: `/${language}/mundo`,
        icon: Globe,
      },
      {
        title: "Flow",
        url: `/${language}/flow`,
        icon: Workflow,
      },
    ],
    [clearMessages, t, language]
  )

  if (isFlowPage) {
    return (
      <>
        <Sidebar
          collapsible="icon"
          {...props}
          className="border-r border-zinc-200/50 dark:border-zinc-800/60 bg-white dark:bg-[#0c0d12]"
        >
          <SidebarHeader className="border-b border-zinc-100 dark:border-zinc-800/30 p-4">
            <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500 text-sm font-semibold">
              <button 
                onClick={() => router.push(`/${language}/ai`)}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-xs text-zinc-500 font-mono tracking-wider">09 jul, 20:46</span>
              <MoreHorizontal className="w-4 h-4 text-zinc-500 hover:text-zinc-350 transition-colors ml-auto cursor-pointer" />
            </div>
            <div className="px-1 mt-4 mb-2">
              <h2 className="text-xl font-black text-foreground tracking-tight select-none">Flow</h2>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] p-3 space-y-4 gap-0">
            {/* Custom Flow Items List */}
            <div className="space-y-1">
              {[
                { label: "Todo el contenido multimedia", icon: Image, active: true },
                { label: "Caracteres", icon: Users, active: false },
                { label: "Escenas", icon: Clapperboard, active: false },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-250 cursor-pointer text-left",
                    item.active 
                      ? "bg-zinc-100 dark:bg-zinc-850/80 text-foreground shadow-sm"
                      : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.02] hover:text-zinc-800 dark:hover:text-zinc-300"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", item.active ? "text-[#1890FF]" : "text-zinc-400")} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-200/50 dark:border-zinc-800/60 my-2" />

            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.02] hover:text-zinc-800 dark:hover:text-zinc-300 transition-all duration-250 cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Herramientas</span>
              </button>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-zinc-150 dark:border-zinc-800/40">
            <div className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.02] hover:text-zinc-800 dark:hover:text-zinc-300 transition-all duration-250 cursor-pointer text-left"
              >
                <Trash2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Papelera</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/[0.02] hover:text-zinc-800 dark:hover:text-zinc-300 transition-all duration-250 cursor-pointer text-left"
              >
                <EyeOff className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Ocultar</span>
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
      </>
    )
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
        {...props}
      >
        <SidebarHeader>
          <SidebarLogo />
        </SidebarHeader>
        <SidebarContent className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] gap-0">
          <NavMain items={mainButtons} />
          {state === "expanded" && mounted && <NavChats />}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Search Dialog Overlay */}
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
