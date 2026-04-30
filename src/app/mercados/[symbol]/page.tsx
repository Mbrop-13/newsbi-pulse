import MarketClient from "./market-client";

export async function generateMetadata({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  return {
    title: `${symbol} - Cotización y Gráficos en Vivo | Reclu`,
    description: `Sigue el precio en tiempo real, gráficos avanzados y las últimas noticias de ${symbol} en Reclu.`,
  };
}

export default function MarketPage({ params }: { params: { symbol: string } }) {
  return <MarketClient symbol={params.symbol.toUpperCase()} />;
}
