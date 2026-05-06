import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { employeeCode: "asc" },
      take: 500,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
        department: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(staff);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/staff]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
