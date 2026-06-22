import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";
import { AuthGuard } from "@/components/auth-guard";

export default function TechGlobalPage() {
  return (
    <SidebarLayout>
      <AuthGuard>
        <CountryFeedPage initialFeed="tech_global" />
      </AuthGuard>
    </SidebarLayout>
  );
}
