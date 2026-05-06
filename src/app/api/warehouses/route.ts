import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        groupType: true,
        sortOrder: true,
        manager: { select: { fullName: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(warehouses);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/warehouses]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
