import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const appUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
      },
    });

    return NextResponse.json({
      user: appUser
        ? {
            ...appUser,
            email: user.email,
          }
        : {
            id: user.id,
            employeeCode: null,
            fullName: user.email ?? "Unknown",
            role: null,
            email: user.email,
          },
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
