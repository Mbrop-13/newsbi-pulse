"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useState, useCallback } from "react"
import Link from "next/link"

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
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"

interface FinanceItem {
  title: string
  url: string
  icon: LucideIcon
}

export function NavFinance({ items }: { items: FinanceItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const [isOpen, setIsOpen] = useState(true) // Open by default, same as Chats!
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openModal = useAuthModalStore((s) => s.openModal)

  const handleNavigate = useCallback(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  return (
    <SidebarGroup className="pt-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between">
                <span>Finanzas</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="border-l-0 pl-0 ml-0 mx-0 px-0 space-y-0.5 mt-1">
                {items.map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton asChild className="w-full">
                      <Link
                        href={item.url}
                        onClick={(e) => {
                          // Auth gate check for secure routes
                          const PUBLIC_ROUTES = ["/", "#", "/ai", "/home", "/suscripcion", "/empresas", "/empresas/dashboard", "/invitar"]
                          if (!isAuthenticated && !PUBLIC_ROUTES.includes(item.url)) {
                            e.preventDefault()
                            openModal("register")
                            return
                          }
                          handleNavigate()
                        }}
                        className="flex items-center gap-2.5 w-full py-1.5 transition-all"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </SidebarMenu>
      </Collapsible>
    </SidebarGroup>
  )
}
