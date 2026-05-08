import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // 1. Verify caller is an admin
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminCheck } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminCheck || adminCheck.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // 2. Fetch all users from auth.users (requires service role)
    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();
    
    if (authError) {
      throw new Error("Error fetching users from Auth: " + authError.message);
    }

    // 3. Fetch all subscriptions and admin roles
    const { data: subscriptions } = await serviceClient.from("subscriptions").select("*");
    const { data: adminUsers } = await serviceClient.from("admin_users").select("*");

    // 4. Map everything together
    const enrichedUsers = authUsers.users.map((u) => {
      const sub = subscriptions?.find((s) => s.user_id === u.id);
      const adm = adminUsers?.find((a) => a.user_id === u.id);
      
      return {
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || "Sin nombre",
        avatar: u.user_metadata?.avatar_url,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        plan: adm?.role === "admin" ? "ultra" : (sub?.tier || "free"),
        status: sub?.status || "none",
        isAdmin: adm?.role === "admin"
      };
    });

    // Sort by creation date descending
    enrichedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ users: enrichedUsers });
  } catch (error: any) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
