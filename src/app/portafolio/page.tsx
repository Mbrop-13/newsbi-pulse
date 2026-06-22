import { Metadata } from "next";
import PortfolioClient from "./portfolio-client";
import { SidebarLayoutWrapper } from "./sidebar-wrapper";
import { AuthGuard } from "@/components/auth-guard";

export const metadata: Metadata = {
  title: "Portafolio | Maverlang",
  description: "Rastrea tus inversiones y recibe alertas en tiempo real con Maverlang IA.",
};

export default function PortfolioPage() {
  return (
    <SidebarLayoutWrapper>
      <AuthGuard>
        <PortfolioClient />
      </AuthGuard>
    </SidebarLayoutWrapper>
  );
}
