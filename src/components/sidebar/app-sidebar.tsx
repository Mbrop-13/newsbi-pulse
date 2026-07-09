"use client"

import * as React from "react"
import {
  MessageSquarePlus,
  Search,
  Briefcase,
  TrendingUp,
  Newspaper,
  Globe,
  Settings,
  FolderKanban,
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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const clearMessages = useAIChatStore((s) => s.clearMessages)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const language = useLanguageStore((s) => s.language)
  const { t } = useTranslation(language)

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
