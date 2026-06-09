"use client"

import * as React from "react"
import { PanelLeftClose } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function SidebarLogo() {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar()
  const handleHomeClick = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <div className="flex items-center pl-1 pr-2 py-2">
      <Link
        href="/"
        aria-label="Go to home"
        className="flex items-center gap-3 flex-1 h-full"
        onClick={handleHomeClick}
      >
        {state === "expanded" ? (
          <img 
            src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/freepik__background__94196.png?v=1771922713" 
            alt="Reclu Logo" 
            className="h-16 w-auto object-contain" 
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden shadow-sm bg-transparent shrink-0">
            <img src="/assets/reclu-favicon.png" alt="Reclu Logo" className="h-full w-full object-cover" />
          </div>
        )}
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
