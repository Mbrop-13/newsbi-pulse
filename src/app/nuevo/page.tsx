import { CountryFeedPage } from "@/components/country-feed-page";
import { AuthGuard } from "@/components/auth-guard";

export default function NuevoPage() {
  return (
    <AuthGuard>
      <CountryFeedPage initialFilter="nuevo" />
    </AuthGuard>
  );
}
