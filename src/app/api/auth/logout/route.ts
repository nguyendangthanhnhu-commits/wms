import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ error: "Logout failed" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
