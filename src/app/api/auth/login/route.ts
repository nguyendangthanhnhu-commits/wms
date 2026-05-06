import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Trang /login đã hỗ trợ Email/Password (server action). Endpoint này giữ chỗ cho OAuth/Magic Link (TODO).",
    },
    { status: 501 }
  );
}
