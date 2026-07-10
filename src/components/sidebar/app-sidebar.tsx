"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageSquarePlus,
  Search,
  Workflow,
  ArrowLeft,
  PanelLeftClose,
} from "lucide-react"
import { useTheme } from "next-themes"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { NavChats } from "@/components/sidebar/nav-chats"
import { SidebarLogo } from "@/components/sidebar/sidebar-logo"
import { SearchDialog } from "@/components/search-dialog"
import { Button } from "@/components/ui/button"
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
  const { state, toggleSidebar } = useSidebar()
  const { resolvedTheme } = useTheme()
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

  const isDark = mounted && resolvedTheme === "dark"
  const logoSrc = isDark
    ? "/assets/Logo 2-Blanco.png"
    : "/assets/Maverlang Logo-2.png"

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
        title: "Flow",
        url: `/${language}/flow`,
        icon: Workflow,
      },
    ],
    [clearMessages, t, language]
  )

  return (
    <>
      <Sidebar
        collapsible="icon"
        {...props}
      >
        <SidebarHeader>
          {isFlowPage ? (
            <div className={`flex items-center ${state === "expanded" ? "pl-2.5 pr-2 py-2" : "justify-center py-2 flex-col"}`}>
              {state === "expanded" ? (
                <>
                  <div className="flex-1 flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/${language}/ai`)}
                      className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 text-zinc-550 dark:text-zinc-450" />
                    </button>
                    <img 
                      src={logoSrc} 
                      alt="Maverlang Logo" 
                      className="h-7 w-7 object-contain shrink-0 select-none pointer-events-none" 
                    />
                    <span className="text-sm font-bold text-foreground select-none leading-none mt-0.5">Flow</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSidebar(); }}
                    className="h-8 w-8 shrink-0 transition-transform duration-200"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSidebar(); }}
                  className="h-8 w-8 shrink-0 transition-transform duration-200 rotate-180"
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              )}
            </div>
          ) : (
            <SidebarLogo />
          )}
        </SidebarHeader>
        <SidebarContent className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] gap-0">
          <NavMain items={mainButtons} />
          {state === "expanded" && mounted && (
            <NavChats />
          )}
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
