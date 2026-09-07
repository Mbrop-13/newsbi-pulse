import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta | Maverlang",
  description: "Crea tu cuenta gratis o inicia sesión en Maverlang.",
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
