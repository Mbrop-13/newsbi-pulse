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
  const [isOpen, setIsOpen] = useState(false) // Closed by default!
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openModal = useAuthModalStore((s) => s.openModal)

  const handleNavigate = useCallback(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  return (
    <SidebarGroup className="pt-0 pb-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenu>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between hover:bg-zinc-100 dark:hover:bg-zinc-850/80 transition-all">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Finanzas</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-zinc-450 dark:text-zinc-500 transition-transform duration-200 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="border-l border-zinc-100 dark:border-zinc-800/80 ml-3.5 pl-3.5 space-y-0.5 mt-1">
                {items.map((item) => (
                  <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton asChild>
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
                        className="flex items-center gap-2.5 w-full text-zinc-500 dark:text-zinc-400 hover:text-foreground py-1.5 text-xs font-bold transition-all"
                      >
                        <item.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
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
