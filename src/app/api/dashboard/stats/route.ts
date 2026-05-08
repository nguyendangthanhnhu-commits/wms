import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async () => {
  const [warehouses, products, vouchers] = await Promise.all([
    prisma.warehouse.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.stockVoucher.count(),
  ]);

  return NextResponse.json({
    warehouses,
    products,
    vouchers,
  });
});
