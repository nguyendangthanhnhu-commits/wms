import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { revalidateTags, withAuth } from "@/lib/api-handler";
import { CompleteVoucherSchema } from "@/lib/schemas/voucher-complete";

type Tx = Parameters<typeof prisma.$transaction>[0] extends (tx: infer T) => any ? T : never;

function normalizeOptionalString(input: string | undefined) {
  const v = input?.trim();
  return v ? v : null;
}

type InventoryAdjustArgs = {
  tx: Tx;
  now: Date;
  warehouseId: string;
  productId: string;
  productName: string;
  unitId: string;
  voucherId: string;
  lotNumber: string | null;
  note: string | null;
  transactionType: "IN" | "OUT" | "TRANSFER_IN" | "TRANSFER_OUT";
  delta: number; // positive add, negative subtract
  performedById: string;
};

async function adjustInventoryAndLog(args: InventoryAdjustArgs) {
  const {
    tx,
    now,
    warehouseId,
    productId,
    productName,
    unitId,
    voucherId,
    lotNumber,
    note,
    transactionType,
    delta,
    performedById,
  } = args;

  if (!Number.isFinite(delta) || delta === 0) return;

  const existing = await tx.inventory.findFirst({
    where: { warehouseId, productId, lotNumber },
    select: { id: true, quantity: true },
  });

  const quantityBefore = existing?.quantity ?? 0;
  const quantityAfter = quantityBefore + delta;

  if (quantityAfter < 0) {
    return { error: "INSUFFICIENT_STOCK" as const, productName, qty: quantityBefore };
  }

  if (existing) {
    await tx.inventory.update({
      where: { id: existing.id },
      data: { quantity: quantityAfter, unitId },
      select: { id: true },
    });
  } else {
    await tx.inventory.create({
      data: {
        warehouseId,
        productId,
        unitId,
        lotNumber,
        quantity: quantityAfter,
      },
      select: { id: true },
    });
  }

  await tx.inventoryTransaction.create({
    data: {
      warehouseId,
      productId,
      unitId,
      voucherId,
      transactionType,
      quantity: Math.abs(delta),
      quantityBefore,
      quantityAfter,
      lotNumber,
      note,
      performedById,
      performedAt: now,
    },
    select: { id: true },
  });

  return { ok: true as const };
}

export const PATCH = withAuth<{ id: string }>(
  async (request, { params, user }) => {
    const { id } = await params;
    const body = (await request.json()) as unknown;
    const { items } = CompleteVoucherSchema.parse(body);
    const current = user;

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.stockVoucher.findUnique({
        where: { id },
        select: {
          id: true,
          voucherCode: true,
          voucherType: true,
          status: true,
          fromWarehouseId: true,
          toWarehouseId: true,
          approvedById: true,
          items: {
            select: {
              id: true,
              productId: true,
              unitId: true,
              plannedQty: true,
              actualQty: true,
              lotNumber: true,
              note: true,
              product: { select: { name: true } },
            },
          },
        },
      });

      if (!voucher) return { error: "Not found" as const };

      if (voucher.status !== "approved") {
        return { error: "Voucher not approved" as const, message: "Phiếu chưa được duyệt" };
      }

      const needFrom =
        voucher.voucherType === "PX" ||
        voucher.voucherType === "PXT" ||
        voucher.voucherType === "PCT" ||
        voucher.voucherType === "PBL";
      const needTo =
        voucher.voucherType === "PN" ||
        voucher.voucherType === "PNT" ||
        voucher.voucherType === "PCT" ||
        voucher.voucherType === "PQC";

      if (needFrom && !voucher.fromWarehouseId) {
        return { error: "Missing fromWarehouse" as const };
      }
      if (needTo && !voucher.toWarehouseId) {
        return { error: "Missing toWarehouse" as const };
      }

      const voucherItemIds = new Set(voucher.items.map((it) => it.id));
      const inputItemIds = new Set(items.map((it) => it.id));

      if (voucherItemIds.size !== inputItemIds.size) {
        return { error: "Items mismatch" as const };
      }
      for (const itId of voucherItemIds) {
        if (!inputItemIds.has(itId)) return { error: "Items mismatch" as const };
      }

      const now = new Date();

      for (const input of items) {
        const target = voucher.items.find((x) => x.id === input.id);
        if (!target) return { error: "Items mismatch" as const };

        const actualQty = input.actualQty;
        if (!Number.isFinite(actualQty) || actualQty <= 0) {
          return { error: "Invalid actualQty" as const };
        }

        const lotNumber = normalizeOptionalString(input.lotNumber) ?? target.lotNumber ?? null;
        const note = normalizeOptionalString(input.note) ?? target.note ?? null;

        await tx.stockVoucherItem.update({
          where: { id: target.id },
          data: {
            actualQty,
            lotNumber,
            note,
            confirmedById: current.appUser.id,
            confirmedAt: now,
          },
          select: { id: true },
        });

        const productName = target.product.name;
        const unitId = target.unitId;
        const productId = target.productId;

        if (voucher.voucherType === "PN" || voucher.voucherType === "PNT") {
          const r = await adjustInventoryAndLog({
            tx,
            now,
            warehouseId: voucher.toWarehouseId!,
            productId,
            productName,
            unitId,
            voucherId: voucher.id,
            lotNumber,
            note,
            transactionType: "IN",
            delta: actualQty,
            performedById: current.appUser.id,
          });
          if (r && "error" in r) return r;
        } else if (voucher.voucherType === "PX" || voucher.voucherType === "PXT" || voucher.voucherType === "PBL") {
          const r = await adjustInventoryAndLog({
            tx,
            now,
            warehouseId: voucher.fromWarehouseId!,
            productId,
            productName,
            unitId,
            voucherId: voucher.id,
            lotNumber,
            note,
            transactionType: "OUT",
            delta: -actualQty,
            performedById: current.appUser.id,
          });
          if (r && "error" in r) return r;
        } else if (voucher.voucherType === "PQC") {
          const r = await adjustInventoryAndLog({
            tx,
            now,
            warehouseId: voucher.toWarehouseId!,
            productId,
            productName,
            unitId,
            voucherId: voucher.id,
            lotNumber,
            note,
            transactionType: "IN",
            delta: actualQty,
            performedById: current.appUser.id,
          });
          if (r && "error" in r) return r;
        } else if (voucher.voucherType === "PCT") {
          const out = await adjustInventoryAndLog({
            tx,
            now,
            warehouseId: voucher.fromWarehouseId!,
            productId,
            productName,
            unitId,
            voucherId: voucher.id,
            lotNumber,
            note,
            transactionType: "TRANSFER_OUT",
            delta: -actualQty,
            performedById: current.appUser.id,
          });
          if (out && "error" in out) return out;

          const inn = await adjustInventoryAndLog({
            tx,
            now,
            warehouseId: voucher.toWarehouseId!,
            productId,
            productName,
            unitId,
            voucherId: voucher.id,
            lotNumber,
            note,
            transactionType: "TRANSFER_IN",
            delta: actualQty,
            performedById: current.appUser.id,
          });
          if (inn && "error" in inn) return inn;
        } else {
          return { error: "Unsupported voucherType" as const };
        }
      }

      await tx.stockVoucher.update({
        where: { id: voucher.id },
        data: { status: "completed", completedAt: now },
        select: { id: true },
      });

      if (voucher.approvedById) {
        await tx.systemNotification.create({
          data: {
            targetUserId: voucher.approvedById,
            title: "Phiếu đã hoàn thành",
            body: `Phiếu ${voucher.voucherCode} đã được hoàn thành.`,
            type: "voucher_completed",
            refId: voucher.id,
            refType: "StockVoucher",
          },
          select: { id: true },
        });
      }

      return { success: true as const, voucherCode: voucher.voucherCode };
    }, { timeout: 10000, maxWait: 5000 });

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (result.error === "Voucher not approved") {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      if (result.error === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { error: `Tồn kho không đủ: ${result.productName} chỉ còn ${result.qty}` },
          { status: 400 }
        );
      }
      if (result.error === "Missing fromWarehouse" || result.error === "Missing toWarehouse") {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    revalidateTags("vouchers", "inventory", "warehouses", "dashboard-stats");
    return NextResponse.json(result);
  },
  { roles: ["admin", "warehouse_manager", "warehouse_keeper"] }
);

