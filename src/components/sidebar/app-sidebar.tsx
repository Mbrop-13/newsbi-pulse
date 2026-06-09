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
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAIChatStore } from "@/lib/stores/ai-chat-store"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const clearMessages = useAIChatStore((s) => s.clearMessages)
  const [searchOpen, setSearchOpen] = React.useState(false)

  // Navigation data for main buttons
  const mainButtons = React.useMemo(
    () => [
      {
        title: "New Chat",
        url: "/ai",
        icon: MessageSquarePlus,
        onClick: clearMessages,
      },
      {
        title: "Search",
        url: "#",
        icon: Search,
        isAction: true,
        onClick: () => setSearchOpen(true),
      },
      {
        title: "Portafolio",
        url: "/portafolio",
        icon: Briefcase,
      },
      {
        title: "Mercados",
        url: "/mercados",
        icon: TrendingUp,
      },
      {
        title: "Noticias",
        url: "/noticias",
        icon: Newspaper,
      },
      {
        title: "Mundo",
        url: "/mundo",
        icon: Globe,
      },
    ],
    [clearMessages]
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
          {state === "expanded" && <NavChats />}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Search Dialog Overlay */}
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
