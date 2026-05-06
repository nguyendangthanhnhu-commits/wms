import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "TODO: triển khai logout Supabase (clear cookies)." },
    { status: 501 }
  );
}
