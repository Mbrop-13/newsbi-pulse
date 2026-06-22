"use client";

import { SidebarLayout } from "@/components/sidebar/sidebar-layout";
import { CountryFeedPage } from "@/components/country-feed-page";
import { AuthGuard } from "@/components/auth-guard";

export default function NoticiasPage() {
  return (
    <SidebarLayout>
      <AuthGuard>
        <CountryFeedPage />
      </AuthGuard>
    </SidebarLayout>
  );
}
