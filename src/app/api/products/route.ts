import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        productType: true,
        baseUnit: { select: { code: true } },
      },
      orderBy: { sku: "asc" },
      take: 200,
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/products]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
