import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidateTags } from "@/lib/api-handler";
import { CreateProductSchema } from "@/lib/schemas/products";

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

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin" && role !== "warehouse_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as unknown;
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    const created = await prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        productType: input.productType,
        baseUnitId: input.baseUnitId,
        categoryId: input.categoryId,
        minStockLevel: input.minStockLevel ?? 0,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });

    revalidateTags("products");
    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[POST /api/products]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
