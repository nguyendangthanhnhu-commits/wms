import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateInventoryCheckSchema } from "@/lib/schemas/inventory-checks";

export async function GET() {
  try {
    const sessions = await prisma.inventoryCheckSession.findMany({
      orderBy: { shiftDate: "desc" },
      take: 200,
      select: {
        id: true,
        checkType: true,
        shiftDate: true,
        status: true,
        warehouse: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/inventory-checks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as unknown;
    const parsed = CreateInventoryCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;
    const shiftDate = input.shiftDate ? new Date(input.shiftDate) : new Date();

    // Role-based warehouse restriction
    if (current.appUser.role === "warehouse_keeper" || current.appUser.role === "production_staff") {
      const assignments = await prisma.warehouseStaffAssignment.findMany({
        where: { userId: current.appUser.id, warehouseId: input.warehouseId },
        select: { id: true },
        take: 1,
      });
      if (!assignments.length) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Duplicate session check (same warehouse + shift + date + type)
    const start = new Date(shiftDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(shiftDate);
    end.setHours(23, 59, 59, 999);

    const duplicate = await prisma.inventoryCheckSession.findFirst({
      where: {
        warehouseId: input.warehouseId,
        checkType: input.checkType,
        shift: input.shift ?? null,
        shiftDate: { gte: start, lte: end },
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Duplicate session" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const session = await tx.inventoryCheckSession.create({
        data: {
          warehouseId: input.warehouseId,
          checkType: input.checkType,
          shift: input.shift,
          shiftDate,
          status: "in_progress",
          startedAt: new Date(),
          startedById: current.appUser.id,
          notes: input.notes,
        },
        select: { id: true },
      });

      const inventory = await tx.inventory.findMany({
        where: { warehouseId: input.warehouseId },
        select: {
          productId: true,
          unitId: true,
          quantity: true,
          locationId: true,
        },
        take: 5000,
      });

      if (inventory.length) {
        await tx.inventoryCheckItem.createMany({
          data: inventory.map((inv) => ({
            sessionId: session.id,
            productId: inv.productId,
            unitId: inv.unitId,
            systemQty: inv.quantity,
            actualQty: null,
            locationId: inv.locationId ?? null,
          })),
        });
      }

      return session;
    });

    return NextResponse.json({ id: created.id });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[POST /api/inventory-checks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
