import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

function cacheSeconds(kind: "layout" | "list" | "detail" | "dashboard") {
  const envGlobal = Number(process.env.DB_CACHE_REVALIDATE_SECONDS ?? "");
  const byKind = Number(
    ({
      layout: process.env.DB_CACHE_LAYOUT_SECONDS,
      list: process.env.DB_CACHE_LIST_SECONDS,
      detail: process.env.DB_CACHE_DETAIL_SECONDS,
      dashboard: process.env.DB_CACHE_DASHBOARD_SECONDS,
    } as const)[kind] ?? "",
  );

  const fallback = ({ layout: 120, dashboard: 60, list: 60, detail: 45 } as const)[kind];
  const resolved = Number.isFinite(byKind) && byKind > 0 ? byKind : fallback;
  if (Number.isFinite(envGlobal) && envGlobal > 0) return Math.min(resolved, envGlobal);
  return resolved;
}

export const getAppUserForLayout = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, fullName: true },
    });
  },
  ["app-user-for-layout"],
  { revalidate: cacheSeconds("layout"), tags: ["users"] }
);

export const listWarehouses = unstable_cache(
  async () => {
    return prisma.warehouse.findMany({
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
      take: 500,
    });
  },
  ["warehouses-list"],
  { revalidate: cacheSeconds("list"), tags: ["warehouses"] }
);

export const getWarehouseDetail = unstable_cache(
  async (id: string) => {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
        inventory: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
          },
        },
      },
    });
  },
  ["warehouse-detail"],
  { revalidate: cacheSeconds("detail"), tags: ["warehouses"] }
);

export const listProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        productType: true,
        baseUnit: { select: { code: true } },
      },
      orderBy: { sku: "asc" },
      take: 500,
    });
  },
  ["products-list"],
  { revalidate: cacheSeconds("list"), tags: ["products"] }
);

export const getProductDetail = unstable_cache(
  async (id: string) => {
    return prisma.product.findUnique({
      where: { id },
      include: {
        baseUnit: { select: { code: true, name: true } },
        category: { select: { code: true, name: true } },
        suppliers: { include: { supplier: { select: { code: true, name: true } } } },
      },
    });
  },
  ["product-detail"],
  { revalidate: cacheSeconds("detail"), tags: ["products"] }
);

export const listStaff = unstable_cache(
  async () => {
    return prisma.user.findMany({
      where: { isActive: true },
      orderBy: { employeeCode: "asc" },
      take: 500,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
        department: { select: { code: true, name: true } },
      },
    });
  },
  ["staff-list"],
  { revalidate: cacheSeconds("list"), tags: ["staff", "users"] }
);

export const listDepartments = unstable_cache(
  async () => {
    return prisma.department.findMany({
      orderBy: { code: "asc" },
      take: 500,
      select: { id: true, code: true, name: true },
    });
  },
  ["departments-list"],
  { revalidate: cacheSeconds("list"), tags: ["departments"] }
);

export const listOrders = unstable_cache(
  async () => {
    return prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        orderCode: true,
        orderType: true,
        status: true,
        customerName: true,
        requiredDate: true,
        createdAt: true,
      },
    });
  },
  ["orders-list"],
  { revalidate: cacheSeconds("list"), tags: ["orders"] }
);

export const getOrderDetail = unstable_cache(
  async (id: string) => {
    return prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
          },
        },
        vouchers: { select: { id: true, voucherCode: true, voucherType: true, status: true, createdAt: true } },
      },
    });
  },
  ["order-detail"],
  { revalidate: cacheSeconds("detail"), tags: ["orders"] }
);

export const listBomVersions = unstable_cache(
  async () => {
    return prisma.bomVersion.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        versionName: true,
        isActive: true,
        createdAt: true,
        product: { select: { id: true, sku: true, name: true } },
      },
    });
  },
  ["bom-versions-list"],
  { revalidate: cacheSeconds("list"), tags: ["bom"] }
);

export const getBomVersionDetail = unstable_cache(
  async (id: string) => {
    return prisma.bomVersion.findUnique({
      where: { id },
      include: {
        product: { select: { sku: true, name: true } },
        items: {
          include: {
            component: { select: { sku: true, name: true } },
            unit: { select: { code: true } },
          },
        },
      },
    });
  },
  ["bom-version-detail"],
  { revalidate: cacheSeconds("detail"), tags: ["bom"] }
);

export const listProductionOutputs = unstable_cache(
  async () => {
    return prisma.productionOutput.findMany({
      orderBy: { outputDate: "desc" },
      take: 200,
      select: {
        id: true,
        quantity: true,
        shift: true,
        outputDate: true,
        product: { select: { sku: true, name: true } },
        unit: { select: { code: true } },
        voucher: { select: { id: true, voucherCode: true } },
      },
    });
  },
  ["production-outputs-list"],
  { revalidate: cacheSeconds("list"), tags: ["production"] }
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
  { revalidate: cacheSeconds("dashboard"), tags: ["dashboard-stats"] }
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
  { revalidate: cacheSeconds("list"), tags: ["vouchers"] }
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
  { revalidate: cacheSeconds("detail"), tags: ["vouchers"] }
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
  { revalidate: cacheSeconds("list"), tags: ["inventory-checks"] }
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
  { revalidate: cacheSeconds("detail"), tags: ["inventory-checks"] }
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
  { revalidate: cacheSeconds("list"), tags: ["qc"] }
);

export const listDefectReportsPendingQc = unstable_cache(
  async () => {
    return prisma.defectReport.findMany({
      where: { status: "pending_qc" },
      orderBy: { reportedAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        reportedAt: true,
        quantity: true,
        lotNumber: true,
        product: { select: { sku: true, name: true } },
        unit: { select: { code: true } },
        voucher: { select: { id: true, voucherCode: true } },
        discoveredWarehouse: { select: { code: true, name: true } },
        reportedBy: { select: { employeeCode: true, fullName: true } },
      },
    });
  },
  ["defect-reports-pending-qc"],
  { revalidate: cacheSeconds("list"), tags: ["defect-reports"] }
);

export const getDefectReportDetail = unstable_cache(
  async (id: string) => {
    return prisma.defectReport.findUnique({
      where: { id },
      include: {
        product: { select: { sku: true, name: true } },
        unit: { select: { code: true } },
        discoveredWarehouse: { select: { code: true, name: true } },
        reportedBy: { select: { employeeCode: true, fullName: true } },
        voucher: { include: { attachments: true } },
      },
    });
  },
  ["defect-report-detail"],
  { revalidate: cacheSeconds("detail"), tags: ["defect-reports"] }
);

export const getQcEvaluationByDefectReportId = unstable_cache(
  async (defectReportId: string) => {
    return prisma.qcEvaluation.findUnique({
      where: { defectReportId },
      include: {
        voucher: { select: { id: true, voucherCode: true, voucherType: true, status: true } },
        supplier: { select: { code: true, name: true } },
        evaluatedBy: { select: { employeeCode: true, fullName: true } },
        responsibleWarehouse: { select: { code: true, name: true } },
        responsibleUser: { select: { employeeCode: true, fullName: true } },
      },
    });
  },
  ["qc-evaluation-by-defect-report"],
  { revalidate: cacheSeconds("detail"), tags: ["qc"] }
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
  { revalidate: cacheSeconds("detail"), tags: ["qc"] }
);

