import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ isAdmin: false }, { status: auth.response.status });
    }

    return NextResponse.json({
      isAdmin: true,
      role: "admin",
      email: auth.data.user.email,
    });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
