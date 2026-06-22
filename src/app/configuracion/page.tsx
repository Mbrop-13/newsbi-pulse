import SettingsClient from "./settings-client";
import { SidebarLayoutWrapper } from "./sidebar-wrapper";
import { AuthGuard } from "@/components/auth-guard";

export const metadata = {
  title: "Configuración | Maverlang",
  description: "Gestiona tus preferencias, notificaciones y seguridad.",
};

export default function SettingsPage() {
  return (
    <SidebarLayoutWrapper>
      <AuthGuard>
        <SettingsClient />
      </AuthGuard>
    </SidebarLayoutWrapper>
  );
}
