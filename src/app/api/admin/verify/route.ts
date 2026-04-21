import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, error: "Not authenticated" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: adminRow } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      isAdmin: !!adminRow && adminRow.role === "admin",
      role: adminRow?.role || null,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json({ isAdmin: false, error: error.message }, { status: 500 });
  }
}
