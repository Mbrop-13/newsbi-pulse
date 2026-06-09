import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export default function EconomiaPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage initialFeed="economia" />
    </SidebarLayout>
  );
}
