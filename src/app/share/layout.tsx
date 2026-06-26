/**
 * Layout for shared chat pages — renders children without sidebar, footer, or bottom nav.
 * The parent root layout's ClientLayoutProviders will skip sidebar for /share routes
 * because /share is NOT in sidebarPages. This layout is intentionally minimal.
 */
export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
