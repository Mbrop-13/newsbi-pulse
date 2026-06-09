"use client"

import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    onClick?: () => void
    isAction?: boolean // If true, render as button instead of Link
  }[]
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  function handleNavigate() {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              {item.isAction ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    item.onClick?.()
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </button>
              ) : (
                <Link
                  href={item.url}
                  onClick={() => {
                    handleNavigate()
                    item.onClick?.()
                  }}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
