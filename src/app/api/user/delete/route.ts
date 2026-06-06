import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[Delete Profile API] Error: Supabase credentials missing");
      return NextResponse.json({ error: "Error de configuración en el servidor" }, { status: 500 });
    }

    // Initialize admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete the user from auth.users (which cascades to other tables)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("[Delete Profile API] Error deleting user:", error);
      return NextResponse.json({ error: "No se pudo eliminar el usuario: " + error.message }, { status: 500 });
    }

    // Clear session cookies
    await supabase.auth.signOut();

    return NextResponse.json({ success: true, message: "Perfil eliminado con éxito" });
  } catch (err: any) {
    console.error("[Delete Profile API] Exception:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
