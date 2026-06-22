import { CountryFeedPage } from "@/components/country-feed-page";
import { AuthGuard } from "@/components/auth-guard";

export default function ParaTiPage() {
  return (
    <AuthGuard>
      <CountryFeedPage initialFilter="para_ti" />
    </AuthGuard>
  );
}
