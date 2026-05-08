import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { revalidateTags, withAuth } from "@/lib/api-handler";
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

export const POST = withAuth(async (request, { user }) => {
  const current = user;
  const body = (await request.json()) as unknown;
  const input = CreateInventoryCheckSchema.parse(body);
  const shiftDate = input.shiftDate ? new Date(input.shiftDate) : new Date();

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

  const created = await prisma.$transaction(
    async (tx) => {
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
    },
    { timeout: 10000, maxWait: 5000 }
  );

  revalidateTags("inventory-checks", "dashboard-stats");
  return NextResponse.json({ id: created.id });
});
