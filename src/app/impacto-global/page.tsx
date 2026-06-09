import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export default function ImpactoGlobalPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage initialFeed="impacto_global" />
    </SidebarLayout>
  );
}
