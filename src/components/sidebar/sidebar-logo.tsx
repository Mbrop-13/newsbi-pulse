"use client"

import * as React from "react"
import { PanelLeftClose } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

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

  return (
    <div className={`flex items-center ${state === "expanded" ? "pl-1 pr-2 py-2" : "justify-center py-2"}`}>
      <Link
        href="/"
        aria-label="Go to home"
        className={`flex items-center ${state === "expanded" ? "flex-1 h-full pl-2" : "justify-center"}`}
        onClick={handleHomeClick}
      >
        <img 
          src={logoSrc} 
          alt="Maverlang Logo" 
          className="h-7 w-7 object-contain shrink-0" 
        />
      </Link>
      {state === "expanded" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-6 w-6 shrink-0 ml-2"
        >
          <PanelLeftClose className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      )}
    </div>
  )
}
