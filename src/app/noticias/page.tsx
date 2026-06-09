"use client";

import { SidebarLayout } from "@/components/sidebar/sidebar-layout";
import { CountryFeedPage } from "@/components/country-feed-page";

export default function NoticiasPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage />
    </SidebarLayout>
  );
}
