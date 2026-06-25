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
    <div className={`flex items-center ${state === "expanded" ? "pl-2 pr-2 py-2" : "justify-center py-2 flex-col"}`}>
      <Link
        href="/home"
        aria-label="Go to home"
        className={cn("flex items-center h-full w-full", state === "expanded" ? "flex-1 pl-1" : "hidden")}
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
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSidebar(); }}
        className={cn("h-8 w-8 shrink-0 transition-transform duration-200", state === "collapsed" && "rotate-180")}
      >
        <PanelLeftClose className="h-4 w-4" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  )
}
