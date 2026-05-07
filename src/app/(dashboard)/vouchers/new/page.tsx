import { prisma } from "@/lib/prisma";

import { VoucherForm } from "@/app/(dashboard)/vouchers/new/voucher-form";

export const dynamic = "force-dynamic";

export default async function NewVoucherPage() {
  const [warehouses, products, salesOrders, whitelist] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, name: true, groupType: true },
      take: 500,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sku: "asc" },
      select: { id: true, sku: true, name: true, baseUnitId: true, baseUnit: { select: { code: true } } },
      take: 1000,
    }),
    prisma.salesOrder.findMany({
      where: { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      select: { id: true, orderCode: true, customerName: true },
      take: 200,
    }),
    prisma.warehouseProductWhitelist.findMany({
      select: { warehouseId: true, productId: true },
      take: 5000,
    }),
  ]);

  return (
    <VoucherForm
      warehouses={warehouses}
      products={products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        baseUnitId: p.baseUnitId,
        baseUnitCode: p.baseUnit.code,
      }))}
      salesOrders={salesOrders}
      whitelist={whitelist}
    />
  );
}
