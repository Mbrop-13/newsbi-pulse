import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClientLayoutProviders } from "./client-providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://maverlang.cl"),
  title: "Maverlang | Copiloto e Inteligencia Artificial",
  description: "Plataforma avanzada de Inteligencia Artificial para análisis de noticias, portafolio y toma de decisiones en tiempo real.",
  keywords: [
    "inteligencia artificial",
    "asistente IA",
    "analisis financiero",
    "Maverlang",
    "noticias IA",
    "agente autonomo",
    "tech news",
  ],
  authors: [{ name: "Maverlang", url: "https://maverlang.cl" }],
  icons: {
    icon: "https://mail.programbi.com/uploads/magnific__background__76233.png",
    apple: "https://mail.programbi.com/uploads/magnific__background__76233.png",
  },
  openGraph: {
    title: "Maverlang | Inteligencia Artificial y Toma de Decisiones",
    description: "Plataforma avanzada de Inteligencia Artificial para análisis de noticias, portafolio y toma de decisiones en tiempo real.",
    url: "https://maverlang.cl",
    siteName: "Maverlang",
    type: "website",
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maverlang | Inteligencia Artificial y Toma de Decisiones",
    description: "Plataforma avanzada de Inteligencia Artificial para análisis de noticias, portafolio y toma de decisiones en tiempo real.",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
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
        <Analytics />
      </body>
    </html>
  );
}
