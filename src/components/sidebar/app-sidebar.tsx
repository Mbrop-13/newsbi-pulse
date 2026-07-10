"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageSquarePlus,
  Search,
  Workflow,
  ArrowLeft,
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
            <div className="flex items-center gap-3 px-3.5 py-4 border-b border-zinc-100 dark:border-zinc-800/30">
              <button 
                onClick={() => router.push(`/${language}/ai`)}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-550 dark:text-zinc-450" />
              </button>
              <span className="text-sm font-bold text-foreground select-none leading-none mt-0.5">Flow</span>
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
