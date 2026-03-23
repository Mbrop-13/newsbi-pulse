import { notFound } from "next/navigation";
import { isValidCountry } from "@/lib/country-config";
import { CountryFeedPage } from "@/components/country-feed-page";

interface Props {
  params: Promise<{ country: string }>;
}

export default async function CountryPage({ params }: Props) {
  const { country } = await params;
  if (!isValidCountry(country)) return notFound();
  return <CountryFeedPage countrySlug={country} />;
}
