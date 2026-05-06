import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

export const getAppUserForLayout = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, fullName: true },
    });
  },
  ["app-user-for-layout"],
  { revalidate: 60 }
);

export const getDashboardCounts = unstable_cache(
  async () => {
    const [warehouses, products, vouchers, sessions, qc] = await Promise.all([
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.stockVoucher.count(),
      prisma.inventoryCheckSession.count(),
      prisma.qcEvaluation.count(),
    ]);

    return { warehouses, products, vouchers, sessions, qc };
  },
  ["dashboard-counts"],
  { revalidate: 30 }
);

export const listVouchers = unstable_cache(
  async () => {
    return prisma.stockVoucher.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        voucherCode: true,
        voucherType: true,
        status: true,
        createdAt: true,
        fromWarehouse: { select: { code: true, name: true } },
        toWarehouse: { select: { code: true, name: true } },
      },
    });
  },
  ["vouchers-list"],
  { revalidate: 15 }
);

export const getVoucherDetail = unstable_cache(
  async (id: string) => {
    return prisma.stockVoucher.findUnique({
      where: { id },
      include: {
        fromWarehouse: { select: { code: true, name: true } },
        toWarehouse: { select: { code: true, name: true } },
        createdBy: { select: { employeeCode: true, fullName: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true, name: true } },
          },
        },
        defectReport: true,
        qcEvaluation: true,
        attachments: true,
      },
    });
  },
  ["voucher-detail"],
  { revalidate: 15 }
);

export const listInventoryCheckSessions = unstable_cache(
  async () => {
    return prisma.inventoryCheckSession.findMany({
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
  },
  ["inventory-check-sessions"],
  { revalidate: 15 }
);

export const getInventoryCheckSessionDetail = unstable_cache(
  async (id: string) => {
    return prisma.inventoryCheckSession.findUnique({
      where: { id },
      include: {
        warehouse: { select: { code: true, name: true } },
        items: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
            location: { select: { barcode: true, rack: true, shelf: true, bin: true } },
          },
          orderBy: { productId: "asc" },
        },
        photos: true,
      },
    });
  },
  ["inventory-check-session-detail"],
  { revalidate: 15 }
);

export const listQcEvaluations = unstable_cache(
  async () => {
    return prisma.qcEvaluation.findMany({
      orderBy: { evaluatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        defectType: true,
        resolution: true,
        evaluatedAt: true,
        voucher: { select: { id: true, voucherCode: true } },
      },
    });
  },
  ["qc-evaluations-list"],
  { revalidate: 15 }
);

export const getQcEvaluationDetail = unstable_cache(
  async (id: string) => {
    return prisma.qcEvaluation.findUnique({
      where: { id },
      include: {
        voucher: { select: { id: true, voucherCode: true, voucherType: true, status: true } },
        defectReport: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
            discoveredWarehouse: { select: { code: true, name: true } },
            reportedBy: { select: { employeeCode: true, fullName: true } },
          },
        },
        supplier: { select: { code: true, name: true } },
        evaluatedBy: { select: { employeeCode: true, fullName: true } },
        responsibleWarehouse: { select: { code: true, name: true } },
        responsibleUser: { select: { employeeCode: true, fullName: true } },
      },
    });
  },
  ["qc-evaluation-detail"],
  { revalidate: 15 }
);

