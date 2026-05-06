import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        orderCode: true,
        orderType: true,
        status: true,
        customerName: true,
        requiredDate: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/orders]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
