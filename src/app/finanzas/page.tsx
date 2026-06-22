import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";
import { AuthGuard } from "@/components/auth-guard";

export default function FinanzasPage() {
  return (
    <SidebarLayout>
      <AuthGuard>
        <CountryFeedPage initialFeed="finanzas" />
      </AuthGuard>
    </SidebarLayout>
  );
}
