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
    <div className={`flex items-center ${state === "expanded" ? "pl-1 pr-2 py-2" : "justify-center py-2"}`}>
      <Link
        href="/"
        aria-label="Go to home"
        className={`flex items-center ${state === "expanded" ? "gap-3 flex-1 h-full" : "justify-center"}`}
        onClick={handleHomeClick}
      >
        {state === "expanded" ? (
          <>
            <img 
              src="/assets/maverlang-logo-small.png" 
              alt="Maverlang Logo" 
              className="h-8 w-8 object-contain" 
            />
            <span className="text-xl font-black tracking-tighter text-[#1890FF] italic">
              MAVERLANG
            </span>
          </>
        ) : (
          <img 
            src="/assets/maverlang-logo-small.png" 
            alt="Maverlang Logo" 
            className="h-7 w-7 object-contain shrink-0" 
          />
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
