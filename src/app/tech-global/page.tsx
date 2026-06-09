import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

export default function TechGlobalPage() {
  return (
    <SidebarLayout>
      <CountryFeedPage initialFeed="tech_global" />
    </SidebarLayout>
  );
}
