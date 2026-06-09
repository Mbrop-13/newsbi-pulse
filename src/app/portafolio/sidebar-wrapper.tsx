"use client";

import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export function SidebarLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
