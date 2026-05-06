import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const outputs = await prisma.productionOutput.findMany({
      orderBy: { outputDate: "desc" },
      take: 200,
      select: {
        id: true,
        quantity: true,
        shift: true,
        outputDate: true,
        product: { select: { sku: true, name: true } },
        unit: { select: { code: true } },
      },
    });

    return NextResponse.json(outputs);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/production]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
