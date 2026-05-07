import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UpdateProductSchema } from "@/lib/schemas/products";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin" && role !== "warehouse_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    await prisma.product.update({
      where: { id },
      data: {
        ...(input.sku ? { sku: input.sku } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.productType ? { productType: input.productType } : {}),
        ...(input.baseUnitId ? { baseUnitId: input.baseUnitId } : {}),
        ...(typeof input.minStockLevel === "number" ? { minStockLevel: input.minStockLevel } : {}),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
        ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[PATCH /api/products/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin" && role !== "warehouse_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    // soft delete to preserve referential integrity
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[DELETE /api/products/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

