import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current?.authUser) return NextResponse.json({ user: null });

    const { authUser, appUser } = current;

    return NextResponse.json({
      user: {
        id: appUser.id,
        employeeCode: appUser.employeeCode,
        fullName: appUser.fullName,
        role: appUser.role,
        email: authUser.email ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
