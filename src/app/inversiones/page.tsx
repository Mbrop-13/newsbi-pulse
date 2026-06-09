import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export default function InversionesPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage initialFeed="inversiones" />
    </SidebarLayout>
  );
}
