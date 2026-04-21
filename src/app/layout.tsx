import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientLayoutProviders } from "./client-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Reclu | Noticias y Análisis IA",
  description: "Plataforma de noticias impulsada por Inteligencia Artificial y agentes autónomos.",
  keywords: [
    "noticias IA",
    "Reclu",
    "Grok",
    "noticias Chile",
    "tech news",
    "business news",
  ],
  authors: [{ name: "Reclu", url: "https://reclu.com" }],
  openGraph: {
    title: "Reclu | Noticias IA en Tiempo Real",
    description: "Plataforma de noticias impulsada por IA Grok. Análisis inteligente y cobertura en vivo.",
    url: "https://reclu.vercel.app",
    siteName: "Reclu",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reclu | Noticias IA en Tiempo Real",
    description: "Plataforma de noticias IA by Reclu. Análisis inteligente y cobertura en vivo.",
  },
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0A09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ClientLayoutProviders>{children}</ClientLayoutProviders>
      </body>
    </html>
  );
}
