import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { revalidateTags, withAuth } from "@/lib/api-handler";
import { QcEvaluateSchema } from "@/lib/schemas/qc-evaluate";

type Tx = Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => any ? T : never;

async function adjustInventoryTransfer(args: {
  tx: Tx;
  now: Date;
  productId: string;
  unitId: string;
  lotNumber: string | null;
  quantity: number;
  fromWarehouseId: string;
  toWarehouseId: string;
  note: string | null;
  performedById: string;
  voucherId: string;
  productName: string;
}) {
  const {
    tx,
    now,
    productId,
    unitId,
    lotNumber,
    quantity,
    fromWarehouseId,
    toWarehouseId,
    note,
    performedById,
    voucherId,
    productName,
  } = args;

  const fromInv = await tx.inventory.findFirst({
    where: { warehouseId: fromWarehouseId, productId, lotNumber },
    select: { id: true, quantity: true },
  });
  const fromBefore = fromInv?.quantity ?? 0;
  const fromAfter = fromBefore - quantity;
  if (fromAfter < 0) {
    return { error: "INSUFFICIENT_STOCK" as const, productName, qty: fromBefore };
  }

  if (fromInv) {
    await tx.inventory.update({
      where: { id: fromInv.id },
      data: { quantity: fromAfter, unitId },
      select: { id: true },
    });
  } else {
    // no record but need to subtract -> insufficient already handled
    return { error: "INSUFFICIENT_STOCK" as const, productName, qty: 0 };
  }

  await tx.inventoryTransaction.create({
    data: {
      warehouseId: fromWarehouseId,
      productId,
      unitId,
      voucherId,
      transactionType: "TRANSFER_OUT",
      quantity,
      quantityBefore: fromBefore,
      quantityAfter: fromAfter,
      lotNumber,
      note,
      performedById,
      performedAt: now,
    },
    select: { id: true },
  });

  const toInv = await tx.inventory.findFirst({
    where: { warehouseId: toWarehouseId, productId, lotNumber },
    select: { id: true, quantity: true },
  });
  const toBefore = toInv?.quantity ?? 0;
  const toAfter = toBefore + quantity;

  if (toInv) {
    await tx.inventory.update({
      where: { id: toInv.id },
      data: { quantity: toAfter, unitId },
      select: { id: true },
    });
  } else {
    await tx.inventory.create({
      data: { warehouseId: toWarehouseId, productId, unitId, lotNumber, quantity: toAfter },
      select: { id: true },
    });
  }

  await tx.inventoryTransaction.create({
    data: {
      warehouseId: toWarehouseId,
      productId,
      unitId,
      voucherId,
      transactionType: "TRANSFER_IN",
      quantity,
      quantityBefore: toBefore,
      quantityAfter: toAfter,
      lotNumber,
      note,
      performedById,
      performedAt: now,
    },
    select: { id: true },
  });

  return { ok: true as const };
}

export const POST = withAuth<{ id: string }>(
  async (request, { params, user }) => {
    const current = user;
    const { id } = await params; // defectReportId
    const body = (await request.json()) as unknown;
    const input = QcEvaluateSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const defect = await tx.defectReport.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          productId: true,
          quantity: true,
          unitId: true,
          lotNumber: true,
          voucherId: true,
          voucher: {
            select: {
              id: true,
              voucherCode: true,
              toWarehouseId: true,
              items: { select: { id: true, actualQty: true } },
            },
          },
          product: { select: { name: true } },
        },
      });

      if (!defect) return { error: "Not found" as const };
      if (defect.status !== "pending_qc") return { error: "Invalid status" as const };

      const qualityWh = await tx.warehouse.findFirst({
        where: { groupType: "quality", isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { sortOrder: "asc" },
      });
      const defectWh = await tx.warehouse.findFirst({
        where: { groupType: "defect", isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { sortOrder: "asc" },
      });
      if (!qualityWh || !defectWh) return { error: "Missing warehouses" as const };

      const now = new Date();

      const receivedDate = input.receivedDate ? new Date(input.receivedDate) : undefined;
      const qcNotes = input.qcNotes?.trim() || null;

      const evaluation = await tx.qcEvaluation.create({
        data: {
          voucherId: defect.voucherId,
          defectReportId: defect.id,
          defectType: input.defectType,
          supplierId: input.defectType === "original" ? input.supplierId : undefined,
          lotNumber: input.defectType === "original" ? input.lotNumber : undefined,
          receivedDate: input.defectType === "original" ? receivedDate : undefined,
          responsibleWarehouseId: input.defectType === "production" ? input.responsibleWarehouseId : undefined,
          responsibleUserId: input.defectType === "production" ? input.responsibleUserId : undefined,
          resolution: input.resolution,
          qcNotes,
          evaluatedById: current.appUser.id,
          evaluatedAt: now,
        },
        select: { id: true },
      });

      await tx.defectReport.update({
        where: { id: defect.id },
        data: { status: "evaluated" },
        select: { id: true },
      });

      // Create PQC voucher to represent transfer QC -> Defect
      const pqc = await tx.stockVoucher.create({
        data: {
          voucherCode: `PQC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
          voucherType: "PQC",
          status: "completed",
          fromWarehouseId: qualityWh.id,
          toWarehouseId: defectWh.id,
          notes: `QC evaluate: ${defect.voucher.voucherCode}`,
          createdById: current.appUser.id,
          approvedById: current.appUser.id,
          approvedAt: now,
          completedAt: now,
          items: {
            create: [
              {
                productId: defect.productId,
                unitId: defect.unitId,
                plannedQty: defect.quantity,
                actualQty: defect.quantity,
                lotNumber: defect.lotNumber,
                note: qcNotes ?? undefined,
                confirmedById: current.appUser.id,
                confirmedAt: now,
              },
            ],
          },
        },
        select: { id: true, voucherCode: true },
      });

      const moved = await adjustInventoryTransfer({
        tx,
        now,
        productId: defect.productId,
        unitId: defect.unitId,
        lotNumber: defect.lotNumber ?? null,
        quantity: defect.quantity,
        fromWarehouseId: qualityWh.id,
        toWarehouseId: defectWh.id,
        note: qcNotes,
        performedById: current.appUser.id,
        voucherId: pqc.id,
        productName: defect.product.name,
      });
      if ("error" in moved) return moved;

      const managers = await tx.user.findMany({
        where: { role: { in: ["warehouse_manager", "admin"] }, isActive: true },
        select: { id: true },
        take: 200,
      });

      if (managers.length) {
        await tx.systemNotification.createMany({
          data: managers.map((u) => ({
            targetUserId: u.id,
            title: "QC đã đánh giá linh kiện lỗi",
            body: `QC đã đánh giá ${defect.quantity} ${defect.product.name} — ${input.defectType}`,
            type: "qc_evaluated",
            refId: defect.id,
            refType: "DefectReport",
          })),
        });
      }

      if (input.defectType === "production" && input.responsibleUserId) {
        await tx.systemNotification.create({
          data: {
            targetUserId: input.responsibleUserId,
            title: "Bạn được gán trách nhiệm linh kiện lỗi",
            body: `Bạn được gán trách nhiệm cho linh kiện lỗi: ${defect.product.name}`,
            type: "qc_responsibility_assigned",
            refId: evaluation.id,
            refType: "QcEvaluation",
          },
          select: { id: true },
        });
      }

      return { success: true as const, evaluationId: evaluation.id, voucherCode: pqc.voucherCode };
    }, { timeout: 10000, maxWait: 5000 });

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (result.error === "Invalid status")
        return NextResponse.json({ error: "DefectReport không ở trạng thái pending_qc" }, { status: 400 });
      if (result.error === "INSUFFICIENT_STOCK")
        return NextResponse.json(
          { error: `Tồn kho không đủ: ${result.productName} chỉ còn ${result.qty}` },
          { status: 400 }
        );
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    revalidateTags("qc", "defect-reports", "vouchers", "inventory", "dashboard-stats");
    return NextResponse.json(result);
  },
  { roles: ["admin", "qc_officer"] }
);

