import { notFound } from "next/navigation";
import { isValidCountry } from "@/lib/country-config";
import { CountryFeedPage } from "@/components/country-feed-page";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";

interface Props {
  params: Promise<{ country: string }>;
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params;
  if (!isValidCountry(country)) return notFound();
  
  return (
    <SidebarLayout>
      <CountryFeedPage />
    </SidebarLayout>
  );
}
