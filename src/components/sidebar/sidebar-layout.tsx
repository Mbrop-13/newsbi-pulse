"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { useAuthStore } from "@/lib/stores/auth-store"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isAuthenticated, isLoaded } = useAuthStore()

  // If not loaded yet, show nothing (avoids flash)
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    )
  }

  // If not authenticated, render content without sidebar (fallback to normal layout)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-full min-h-screen overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
