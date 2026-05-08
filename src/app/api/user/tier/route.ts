import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/check-limits";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ tier: "free", role: "user" }, { status: 401 });
    }

    // getUserTier already returns "ultra" for admins, but we get both just to be explicit
    const tier = await getUserTier(user.id);
    
    // Check if admin
    const serviceClient = createServiceClient();
    const { data: adminRow } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ 
      tier, 
      role: adminRow?.role === "admin" ? "admin" : "user" 
    });
  } catch (error) {
    return NextResponse.json({ tier: "free", role: "user" }, { status: 500 });
  }
}
