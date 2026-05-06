import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const boms = await prisma.bomVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        versionName: true,
        isActive: true,
        product: { select: { sku: true, name: true } },
      },
    });

    return NextResponse.json(boms);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/bom]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
