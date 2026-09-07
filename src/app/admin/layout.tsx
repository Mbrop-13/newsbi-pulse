import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth-helpers";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/");
  }

  return <AdminShell email={session.user.email || ""}>{children}</AdminShell>;
}
