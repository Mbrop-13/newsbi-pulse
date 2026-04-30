import { Metadata } from "next";
import PortfolioClient from "./portfolio-client";

export const metadata: Metadata = {
  title: "Portafolio | Reclu",
  description: "Rastrea tus inversiones y recibe alertas en tiempo real con Reclu IA.",
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
