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
  title: "NewsBI Pulse | Noticias y Análisis IA",
  description: "Plataforma de noticias impulsada por Inteligencia Artificial y agentes autónomos.",
  keywords: [
    "noticias IA",
    "ProgramBI",
    "Grok",
    "noticias Chile",
    "tech news",
    "business news",
  ],
  authors: [{ name: "ProgramBI", url: "https://programbi.com" }],
  openGraph: {
    title: "NewsBI Pulse | Noticias IA en Tiempo Real",
    description: "Plataforma de noticias impulsada por IA Grok. Análisis inteligente y cobertura en vivo.",
    url: "https://newsbi-pulse.vercel.app",
    siteName: "NewsBI Pulse",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewsBI Pulse | Noticias IA en Tiempo Real",
    description: "Plataforma de noticias IA by ProgramBI. Análisis inteligente y cobertura en vivo.",
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
