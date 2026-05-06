import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [warehouses, products, vouchers] = await Promise.all([
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.stockVoucher.count(),
    ]);

    return NextResponse.json({
      warehouses,
      products,
      vouchers,
    });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/dashboard/stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
