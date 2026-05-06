import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "TODO: triển khai OAuth/Magic link với Supabase Auth (redirect URLs). Tạm thời dùng seed user trong DB.",
    },
    { status: 501 }
  );
}
