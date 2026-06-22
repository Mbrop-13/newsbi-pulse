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
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"

// Rutas accesibles sin autenticación. Todo lo demás del sidebar es protegido:
// al clicar sin sesión se abre el popup de registro en vez de navegar.
const PUBLIC_ROUTES = ["/", "#", "/ai", "/home", "/suscripcion"]

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openModal = useAuthModalStore((s) => s.openModal)

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
                  onClick={(e) => {
                    // Gate: si no está autenticado y la ruta no es pública, abrir
                    // el popup de registro y bloquear la navegación.
                    if (!isAuthenticated && !PUBLIC_ROUTES.includes(item.url)) {
                      e.preventDefault()
                      openModal("register")
                      return
                    }
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
