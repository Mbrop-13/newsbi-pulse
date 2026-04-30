import MarketClient from "./market-client";

interface MarketPageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: MarketPageProps) {
  const { symbol } = await params;
  const s = symbol.toUpperCase();
  return {
    title: `${s} - Cotización y Gráficos en Vivo | Reclu`,
    description: `Sigue el precio en tiempo real, gráficos avanzados y las últimas noticias de ${s} en Reclu.`,
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { symbol } = await params;
  return <MarketClient symbol={symbol.toUpperCase()} />;
}
