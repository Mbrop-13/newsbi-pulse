import SettingsClient from "./settings-client";

export const metadata = {
  title: "Configuración | Reclu",
  description: "Gestiona tus preferencias, notificaciones y seguridad.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
