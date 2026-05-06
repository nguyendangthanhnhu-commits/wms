import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
        inventory: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(warehouse);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/warehouses/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
