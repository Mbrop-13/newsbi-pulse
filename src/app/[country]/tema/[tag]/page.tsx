import { notFound } from "next/navigation";
import { isValidCountry } from "@/lib/country-config";
import { CountryFeedPage } from "@/components/country-feed-page";

interface Props {
  params: Promise<{ country: string; tag: string }>;
}

export default async function TemaPage({ params }: Props) {
  const { country, tag } = await params;
  if (!isValidCountry(country)) return notFound();
  if (!tag) return notFound();

  return <CountryFeedPage searchTag={tag} />;
}
