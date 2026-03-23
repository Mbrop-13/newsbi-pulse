import { notFound } from "next/navigation";
import { isValidCountry } from "@/lib/country-config";
import { CountryFeedPage } from "@/components/country-feed-page";

const VALID_FEEDS = ['tech-global', 'impacto-global', 'finanzas', 'inversiones', 'economia'];

interface Props {
  params: Promise<{ country: string; feed: string }>;
}

export default async function FeedPage({ params }: Props) {
  const { country, feed } = await params;
  if (!isValidCountry(country)) return notFound();
  if (!VALID_FEEDS.includes(feed)) return notFound();
  
  const feedTagMap: Record<string, string> = {
    'tech-global': 'tech_global',
    'impacto-global': 'impacto_global',
    'finanzas': 'finanzas',
    'inversiones': 'inversiones',
    'economia': 'economia',
  };

  return <CountryFeedPage countrySlug={country} initialFeed={feedTagMap[feed]} />;
}
