"use client"

import * as React from "react"
import { PanelLeft, PanelLeftClose } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { useTheme } from "next-themes"

export function SidebarLogo() {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleHomeClick = () => {
    if (isMobile) setOpenMobile(false)
  }

  const isDark = mounted && resolvedTheme === "dark"
  const logoSrc = isDark
    ? "/assets/Logo 2-Blanco.png"
    : "/assets/Maverlang Logo-2.png"

  const isCollapsed = state === "collapsed"

  return (
    <div
      className={cn(
        "flex items-center w-full",
        isCollapsed ? "justify-center py-2" : "pl-2 pr-2 py-2"
      )}
    >
      <Link
        href="/"
        aria-label="Go to home"
        className={cn(
          "flex items-center h-full flex-1 pl-1 min-w-0",
          isCollapsed && "hidden"
        )}
        onClick={handleHomeClick}
      >
        <img
          src={logoSrc}
          alt="Maverlang Logo"
          className="h-7 w-7 object-contain shrink-0 select-none pointer-events-none"
        />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleSidebar()
        }}
        className="h-8 w-8 shrink-0"
        title={isCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral"}
      >
        {/* Sin rotate: solo cambia el icono según el estado */}
        {isCollapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  )
}
