import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos | Maverlang AI",
  description:
    "Crea y gestiona tus proyectos de desarrollo con Inteligencia Artificial. Construye sitios web, aplicaciones móviles y plataformas multiplataforma con IA en tiempo real.",
  robots: { index: false, follow: false },
};

export default function ProyectosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
