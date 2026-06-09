import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export default function FinanzasPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage initialFeed="finanzas" />
    </SidebarLayout>
  );
}
