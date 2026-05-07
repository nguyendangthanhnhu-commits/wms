import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin" && role !== "warehouse_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.inventoryCheckSession.findUnique({
        where: { id },
        select: { id: true, status: true, warehouseId: true, startedById: true },
      });
      if (!session) return { error: "Not found" as const };
      if (session.status !== "completed") return { error: "Session not completed" as const };

      const now = new Date();

      await tx.inventoryCheckSession.update({
        where: { id },
        data: { status: "approved", approvedById: current.appUser.id, approvedAt: now },
        select: { id: true },
      });

      const items = await tx.inventoryCheckItem.findMany({
        where: { sessionId: id },
        select: {
          id: true,
          productId: true,
          unitId: true,
          systemQty: true,
          actualQty: true,
        },
        take: 2000,
      });

      for (const it of items) {
        if (typeof it.actualQty !== "number") continue;
        if (it.actualQty === it.systemQty) continue;

        const inv = await tx.inventory.findFirst({
          where: { warehouseId: session.warehouseId, productId: it.productId },
          select: { id: true, quantity: true, lotNumber: true },
          orderBy: { updatedAt: "desc" },
        });

        const quantityBefore = inv?.quantity ?? 0;
        const quantityAfter = it.actualQty;

        await tx.inventoryTransaction.create({
          data: {
            warehouseId: session.warehouseId,
            productId: it.productId,
            unitId: it.unitId,
            voucherId: null,
            transactionType: "ADJUST",
            quantity: Math.abs(quantityAfter - quantityBefore),
            quantityBefore,
            quantityAfter,
            lotNumber: inv?.lotNumber ?? null,
            note: "Approve inventory check (sync actualQty)",
            performedById: current.appUser.id,
            performedAt: now,
          },
          select: { id: true },
        });

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantity: quantityAfter, unitId: it.unitId },
            select: { id: true },
          });
        } else {
          await tx.inventory.create({
            data: {
              warehouseId: session.warehouseId,
              productId: it.productId,
              unitId: it.unitId,
              quantity: quantityAfter,
            },
            select: { id: true },
          });
        }
      }

      await tx.systemNotification.create({
        data: {
          targetUserId: session.startedById,
          title: "Kiểm kê đã được phê duyệt",
          body: "Phiên kiểm kê bạn khởi tạo đã được phê duyệt.",
          type: "inventory_check_approved",
          refId: session.id,
          refType: "InventoryCheckSession",
        },
        select: { id: true },
      });

      return { success: true as const };
    });

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (result.error === "Session not completed") return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[PUT /api/inventory-checks/[id]/approve]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

