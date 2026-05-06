import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.inventoryCheckSession.findMany({
      orderBy: { shiftDate: "desc" },
      take: 200,
      select: {
        id: true,
        checkType: true,
        shiftDate: true,
        status: true,
        warehouse: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/inventory-checks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
