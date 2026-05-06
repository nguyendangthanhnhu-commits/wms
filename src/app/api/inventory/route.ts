import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      take: 500,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        quantity: true,
        lotNumber: true,
        warehouse: { select: { code: true, name: true } },
        product: { select: { sku: true, name: true } },
        unit: { select: { code: true } },
      },
    });

    return NextResponse.json(inventory);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/inventory]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
