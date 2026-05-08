import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidateTags } from "@/lib/api-handler";
import { CreateWarehouseSchema } from "@/lib/schemas/warehouses";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        groupType: true,
        sortOrder: true,
        manager: { select: { fullName: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(warehouses);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/warehouses]", error);
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
    const parsed = CreateWarehouseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    const created = await prisma.warehouse.create({
      data: {
        code: input.code,
        name: input.name,
        groupType: input.groupType as any,
        description: input.description?.trim() || null,
        capacity: typeof input.capacity === "number" ? input.capacity : null,
        managerId: input.managerId ?? null,
        isActive: input.isActive ?? true,
        sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
      },
      select: { id: true },
    });

    revalidateTags("warehouses");
    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[POST /api/warehouses]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
