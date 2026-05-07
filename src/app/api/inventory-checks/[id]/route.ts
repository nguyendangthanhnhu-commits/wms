import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PatchInventoryCheckSchema } from "@/lib/schemas/inventory-checks";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;

    const session = await prisma.inventoryCheckSession.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
          },
        },
        photos: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/inventory-checks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = PatchInventoryCheckSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { action, items } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.inventoryCheckSession.findUnique({
        where: { id },
        select: { id: true, status: true, warehouseId: true, startedById: true },
      });
      if (!session) return { error: "Not found" as const };

      if (session.status !== "in_progress") return { error: "Session not in progress" as const };

      // Only starter or manager/admin can update
      const role = current.appUser.role;
      const canEdit =
        session.startedById === current.appUser.id || role === "admin" || role === "warehouse_manager";
      if (!canEdit) return { error: "Forbidden" as const };

      // validate for complete
      if (action === "complete") {
        for (const it of items) {
          if (it.actualQty === null || typeof it.actualQty !== "number") {
            return { error: "Missing actualQty" as const };
          }
        }
      }

      for (const it of items) {
        const discrepancy =
          typeof it.actualQty === "number"
            ? it.actualQty
            : null;
        // If complete and discrepancy, require reason
        if (action === "complete" && discrepancy !== null) {
          const row = await tx.inventoryCheckItem.findUnique({
            where: { id: it.id },
            select: { systemQty: true },
          });
          if (row && row.systemQty !== discrepancy && !it.discrepancyReason?.trim()) {
            return { error: "Missing discrepancyReason" as const };
          }
        }

        await tx.inventoryCheckItem.update({
          where: { id: it.id },
          data: {
            actualQty: it.actualQty,
            discrepancyReason: it.discrepancyReason?.trim() || null,
            checkedAt: new Date(),
          },
        });
      }

      if (action === "complete") {
        await tx.inventoryCheckSession.update({
          where: { id },
          data: { status: "completed", completedAt: new Date() },
        });

        // notify managers (simple: notify all warehouse_manager + admin)
        const managers = await tx.user.findMany({
          where: { role: { in: ["warehouse_manager", "admin"] }, isActive: true },
          select: { id: true },
          take: 200,
        });
        if (managers.length) {
          await tx.systemNotification.createMany({
            data: managers.map((u) => ({
              targetUserId: u.id,
              title: "Phiên kiểm kê đã hoàn thành",
              body: `Có phiên kiểm kê vừa hoàn thành và chờ phê duyệt.`,
              type: "inventory_check_completed",
              refId: id,
              refType: "InventoryCheckSession",
            })),
          });
        }
      }

      return { success: true as const, status: action === "complete" ? "completed" : "in_progress" };
    });

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (result.error === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[PATCH /api/inventory-checks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
