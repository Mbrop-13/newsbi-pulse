"use client"

import { ChevronRight, Trash2 } from "lucide-react"
import { useMemo, useState, useCallback } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { slugify } from "@/lib/utils"
import { useAIChatStore, type SavedChat } from "@/lib/stores/ai-chat-store"

export function NavChats() {
  const router = useRouter()
  const { isMobile, setOpenMobile } = useSidebar()
  const handleNavigate = useCallback(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  const [isOpen, setIsOpen] = useState(true)
  const savedChats = useAIChatStore((s) => s.savedChats)
  const loadChat = useAIChatStore((s) => s.loadChat)
  const deleteSavedChat = useAIChatStore((s) => s.deleteSavedChat)
  const currentChatId = useAIChatStore((s) => s.currentChatId)

  // Group chats by date buckets: Today, Yesterday, Previous
  const sections = useMemo(() => {
    const sorted = [...savedChats].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const buckets: { label: string; items: SavedChat[] }[] = [
      { label: "Hoy", items: [] },
      { label: "Ayer", items: [] },
      { label: "Anteriores", items: [] },
    ]

    for (const chat of sorted) {
      const chatDate = new Date(chat.timestamp)
      if (chatDate >= todayStart) {
        buckets[0].items.push(chat)
      } else if (chatDate >= yesterdayStart) {
        buckets[1].items.push(chat)
      } else {
        buckets[2].items.push(chat)
      }
    }

    return buckets.filter((b) => b.items.length > 0)
  }, [savedChats])

  const handleLoadChat = useCallback(
    (id: string, title?: string) => {
      loadChat(id)
      const slug = title ? slugify(title.slice(0, 40)) : ''
      router.push(`/ai/chat/${slug ? `${slug}-` : ''}${id}`)
      handleNavigate()
    },
    [loadChat, router, handleNavigate]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault()
      e.stopPropagation()
      deleteSavedChat(id)
    },
    [deleteSavedChat]
  )

  return (
    <SidebarGroup className="pt-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between">
                <span>Chats</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="border-l-0 pl-0 ml-0 mx-0 px-0">
                {savedChats.length === 0 ? (
                  <SidebarMenuSubItem>
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      Aún no hay chats
                    </div>
                  </SidebarMenuSubItem>
                ) : (
                  sections.map(({ label, items }) => (
                    <div key={label} className="space-y-1">
                      <div className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground tracking-wide">
                        {label}
                      </div>
                      {items.map((chat) => {
                        const isActive = currentChatId === chat.id
                        const displayTitle = chat.title || "Nuevo Chat"
                        return (
                          <SidebarMenuSubItem key={chat.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="w-full"
                            >
                              <div
                                className="group/chat relative w-full flex items-center text-left cursor-pointer"
                              >
                                <button
                                  onClick={() => handleLoadChat(chat.id, chat.title)}
                                  className="flex-1 text-left min-w-0 overflow-hidden pr-0 group-hover/chat:pr-7 py-1"
                                >
                                  <span
                                    className="block whitespace-nowrap overflow-hidden"
                                    style={{
                                      WebkitMaskImage:
                                        "linear-gradient(to right, black calc(100% - 16px), transparent)",
                                      maskImage:
                                        "linear-gradient(to right, black calc(100% - 16px), transparent)",
                                    }}
                                  >
                                    {displayTitle}
                                  </span>
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, chat.id)}
                                  className="h-6 w-6 p-0 flex items-center justify-center opacity-0 group-hover/chat:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 hover:text-destructive transition-opacity"
                                  aria-label="Delete chat"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </div>
                  ))
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </SidebarMenu>
      </Collapsible>
    </SidebarGroup>
  )
}
