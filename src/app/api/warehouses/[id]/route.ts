import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidateTags } from "@/lib/api-handler";
import { UpdateWarehouseSchema } from "@/lib/schemas/warehouses";

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
    const parsed = UpdateWarehouseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    await prisma.warehouse.update({
      where: { id },
      data: {
        ...(input.code ? { code: input.code } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.groupType ? { groupType: input.groupType as any } : {}),
        ...(input.description === undefined ? {} : { description: input.description?.trim() || null }),
        ...(input.capacity === undefined ? {} : { capacity: typeof input.capacity === "number" ? input.capacity : null }),
        ...(input.managerId === undefined ? {} : { managerId: input.managerId ?? null }),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
        ...(input.sortOrder === undefined ? {} : { sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0 }),
      },
      select: { id: true },
    });

    revalidateTags("warehouses");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[PATCH /api/warehouses/[id]]", error);
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

    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    revalidateTags("warehouses");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[DELETE /api/warehouses/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
