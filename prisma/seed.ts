import { PrismaClient, WarehouseGroup } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const departments = [
    { code: "LD", name: "Lãnh đạo" },
    { code: "KD", name: "Kinh doanh" },
    { code: "KHO", name: "Kho" },
    { code: "SX", name: "Sản xuất" },
    { code: "QC", name: "Chất lượng" },
    { code: "MUA", name: "Mua hàng" },
    { code: "IT", name: "CNTT" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: { code: d.code, name: d.name },
    });
  }

  const units = [
    { code: "CHIEC", name: "Chiếc" },
    { code: "TAM", name: "Tấm" },
    { code: "CUON", name: "Cuộn" },
    { code: "LO", name: "Lô" },
    { code: "THUNG", name: "Thùng" },
    { code: "PALLET", name: "Pallet" },
    { code: "KHAY", name: "Khay" },
    { code: "HOP", name: "Hộp" },
    { code: "KIEN", name: "Kiện" },
  ];

  const unitMap = new Map<string, string>();

  for (const u of units) {
    const row = await prisma.unit.upsert({
      where: { code: u.code },
      update: { name: u.name },
      create: { code: u.code, name: u.name },
    });
    unitMap.set(u.code, row.id);
  }

  const adminId = "11111111-1111-4111-8111-111111111111";
  const pinHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { id: adminId },
    update: {
      employeeCode: "ADMIN001",
      fullName: "Administrator",
      role: "admin",
      pinHash,
      isActive: true,
    },
    create: {
      id: adminId,
      employeeCode: "ADMIN001",
      fullName: "Administrator",
      role: "admin",
      pinHash,
      isActive: true,
    },
  });

  const warehouses: Array<{
    code: string;
    name: string;
    groupType: WarehouseGroup;
    sortOrder: number;
  }> = [
    { code: "KHO_LANH", name: "Kho lạnh linh kiện", groupType: "component", sortOrder: 10 },
    { code: "KHO_THUONG", name: "Kho thường linh kiện", groupType: "component", sortOrder: 20 },
    { code: "KHO_TP", name: "Kho thành phẩm", groupType: "finished_good", sortOrder: 30 },
    ...Array.from({ length: 12 }).map((_, idx) => {
      const n = String(idx + 1).padStart(2, "0");
      return {
        code: `KHO_SX_${n}`,
        name: `Kho sản xuất ${n}`,
        groupType: "production" as const,
        sortOrder: 100 + idx,
      };
    }),
    { code: "KHO_CL", name: "Kho chất lượng", groupType: "quality", sortOrder: 300 },
    { code: "KHO_LOI", name: "Kho lỗi / phế", groupType: "defect", sortOrder: 310 },
  ];

  const warehouseIds = new Map<string, string>();

  for (const w of warehouses) {
    const existing = await prisma.warehouse.findUnique({ where: { code: w.code } });

    const saved = existing
      ? await prisma.warehouse.update({
          where: { code: w.code },
          data: {
            name: w.name,
            groupType: w.groupType,
            sortOrder: w.sortOrder,
            managerId: adminId,
            isActive: true,
          },
        })
      : await prisma.warehouse.create({
          data: {
            code: w.code,
            name: w.name,
            groupType: w.groupType,
            sortOrder: w.sortOrder,
            managerId: adminId,
            isActive: true,
          },
        });

    warehouseIds.set(w.code, saved.id);
  }

  // Demo assignments for admin across production warehouses (optional but useful for ShiftCheckGuard testing)
  for (let i = 1; i <= 12; i++) {
    const code = `KHO_SX_${String(i).padStart(2, "0")}`;
    const wid = warehouseIds.get(code);
    if (!wid) continue;

    await prisma.warehouseStaffAssignment.upsert({
      where: { warehouseId_userId: { warehouseId: wid, userId: adminId } },
      update: {},
      create: { warehouseId: wid, userId: adminId },
    });
  }

  console.log("Seed completed:");
  console.log("- Departments:", departments.length);
  console.log("- Units:", units.length);
  console.log("- Warehouses:", warehouses.length);
  console.log("- Admin user id:", adminId);

  // --- Demo master data: categories, suppliers, products, locations, inventory ---
  const catComponents = await prisma.productCategory.upsert({
    where: { code: "LINH_KIEN" },
    update: { name: "Linh kiện" },
    create: { code: "LINH_KIEN", name: "Linh kiện" },
  });

  const catFinished = await prisma.productCategory.upsert({
    where: { code: "TP" },
    update: { name: "Thành phẩm" },
    create: { code: "TP", name: "Thành phẩm" },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: "NCC_DEMO" },
    update: { name: "Nhà cung cấp Demo" },
    create: {
      code: "NCC_DEMO",
      name: "Nhà cung cấp Demo",
      contactName: "CSKH",
      phone: "0900000000",
      email: "supplier.demo@example.com",
      address: "Việt Nam",
    },
  });

  const unitChiec = await prisma.unit.findUnique({ where: { code: "CHIEC" } });
  const unitTam = await prisma.unit.findUnique({ where: { code: "TAM" } });
  if (!unitChiec || !unitTam) throw new Error("Missing units (CHIEC/TAM)");

  const p1 = await prisma.product.upsert({
    where: { sku: "LK-PIN-01" },
    update: { name: "Cell pin mẫu", productType: "component", categoryId: catComponents.id, baseUnitId: unitChiec.id },
    create: {
      sku: "LK-PIN-01",
      name: "Cell pin mẫu",
      productType: "component",
      categoryId: catComponents.id,
      baseUnitId: unitChiec.id,
      minStockLevel: 100,
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: "TP-PIN-01" },
    update: { name: "Pin thành phẩm mẫu", productType: "finished_good", categoryId: catFinished.id, baseUnitId: unitTam.id },
    create: {
      sku: "TP-PIN-01",
      name: "Pin thành phẩm mẫu",
      productType: "finished_good",
      categoryId: catFinished.id,
      baseUnitId: unitTam.id,
      minStockLevel: 10,
    },
  });

  await prisma.productSupplier.upsert({
    where: { productId_supplierId: { productId: p1.id, supplierId: supplier.id } },
    update: { isDefault: true },
    create: { productId: p1.id, supplierId: supplier.id, isDefault: true, unitPrice: 15000 },
  });

  const khoThuong = warehouseIds.get("KHO_THUONG");
  const khoQC = warehouseIds.get("KHO_CL");
  const khoTP = warehouseIds.get("KHO_TP");
  if (!khoThuong || !khoQC || !khoTP) throw new Error("Missing demo warehouses");

  const locThuongA1 = await prisma.warehouseLocation.upsert({
    where: { barcode: "LOC-KHO_THUONG-A1" },
    update: { warehouseId: khoThuong, rack: "A", shelf: "1", bin: "01", isActive: true },
    create: { warehouseId: khoThuong, rack: "A", shelf: "1", bin: "01", barcode: "LOC-KHO_THUONG-A1" },
  });

  const locQcQ1 = await prisma.warehouseLocation.upsert({
    where: { barcode: "LOC-KHO_CL-Q1" },
    update: { warehouseId: khoQC, rack: "Q", shelf: "1", bin: "01", isActive: true },
    create: { warehouseId: khoQC, rack: "Q", shelf: "1", bin: "01", barcode: "LOC-KHO_CL-Q1" },
  });

  await prisma.inventory.upsert({
    where: { warehouseId_productId_lotNumber: { warehouseId: khoThuong, productId: p1.id, lotNumber: "LOT-2026-0001" } },
    update: { quantity: 1200, unitId: unitChiec.id, locationId: locThuongA1.id },
    create: {
      warehouseId: khoThuong,
      productId: p1.id,
      unitId: unitChiec.id,
      quantity: 1200,
      lotNumber: "LOT-2026-0001",
      locationId: locThuongA1.id,
    },
  });

  await prisma.inventory.upsert({
    where: { warehouseId_productId_lotNumber: { warehouseId: khoTP, productId: p2.id, lotNumber: "LOT-TP-0001" } },
    update: { quantity: 35, unitId: unitTam.id },
    create: { warehouseId: khoTP, productId: p2.id, unitId: unitTam.id, quantity: 35, lotNumber: "LOT-TP-0001" },
  });

  // --- Demo vouchers + QC ---
  const today = new Date();
  const voucherPn = await prisma.stockVoucher.upsert({
    where: { voucherCode: "PN-DEMO-0001" },
    update: { status: "approved", toWarehouseId: khoThuong, notes: "Phiếu nhập demo", approvedById: adminId, approvedAt: today },
    create: {
      voucherCode: "PN-DEMO-0001",
      voucherType: "PN",
      status: "approved",
      toWarehouseId: khoThuong,
      notes: "Phiếu nhập demo",
      createdById: adminId,
      approvedById: adminId,
      approvedAt: today,
      items: {
        create: [
          {
            productId: p1.id,
            unitId: unitChiec.id,
            plannedQty: 200,
            actualQty: 200,
            lotNumber: "LOT-2026-0001",
            toLocationId: locThuongA1.id,
          },
        ],
      },
    },
  });

  const voucherPqc = await prisma.stockVoucher.upsert({
    where: { voucherCode: "PQC-DEMO-0001" },
    update: { status: "in_progress", fromWarehouseId: khoThuong, toWarehouseId: khoQC, notes: "Chuyển QC demo" },
    create: {
      voucherCode: "PQC-DEMO-0001",
      voucherType: "PQC",
      status: "in_progress",
      fromWarehouseId: khoThuong,
      toWarehouseId: khoQC,
      notes: "Chuyển QC demo",
      createdById: adminId,
      items: {
        create: [
          {
            productId: p1.id,
            unitId: unitChiec.id,
            plannedQty: 50,
            lotNumber: "LOT-2026-0001",
            fromLocationId: locThuongA1.id,
            toLocationId: locQcQ1.id,
          },
        ],
      },
    },
  });

  const defect = await prisma.defectReport.upsert({
    where: { voucherId: voucherPqc.id },
    update: { description: "Lỗi demo: trầy xước", status: "pending_qc", quantity: 3, unitId: unitChiec.id, productId: p1.id },
    create: {
      voucherId: voucherPqc.id,
      productId: p1.id,
      quantity: 3,
      unitId: unitChiec.id,
      discoveredWarehouseId: khoQC,
      description: "Lỗi demo: trầy xước",
      lotNumber: "LOT-2026-0001",
      status: "pending_qc",
      reportedById: adminId,
    },
  });

  await prisma.qcEvaluation.upsert({
    where: { voucherId: voucherPqc.id },
    update: { defectType: "production", resolution: "pending", qcNotes: "Demo QC", evaluatedById: adminId },
    create: {
      voucherId: voucherPqc.id,
      defectReportId: defect.id,
      defectType: "production",
      supplierId: supplier.id,
      lotNumber: "LOT-2026-0001",
      receivedDate: addDays(today, -2),
      responsibleWarehouseId: khoQC,
      responsibleUserId: adminId,
      resolution: "pending",
      qcNotes: "Demo QC",
      evaluatedById: adminId,
    },
  });

  // --- Demo inventory check sessions ---
  const sessionShift = await prisma.inventoryCheckSession.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: { warehouseId: khoThuong, checkType: "shift_start", shiftDate: today, status: "completed", completedAt: today },
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      warehouseId: khoThuong,
      checkType: "shift_start",
      shift: "admin",
      shiftDate: today,
      status: "completed",
      startedAt: today,
      completedAt: today,
      startedById: adminId,
      notes: "Kiểm kê ca demo",
      items: {
        create: [
          {
            productId: p1.id,
            unitId: unitChiec.id,
            locationId: locThuongA1.id,
            systemQty: 1200,
            actualQty: 1198,
            discrepancyReason: "Hao hụt demo",
            checkedAt: today,
          },
        ],
      },
    },
  });

  await prisma.inventoryCheckSession.upsert({
    where: { id: "22222222-2222-4222-8222-222222222222" },
    update: { warehouseId: khoTP, checkType: "periodic", shiftDate: addDays(today, -7), status: "in_progress" },
    create: {
      id: "22222222-2222-4222-8222-222222222222",
      warehouseId: khoTP,
      checkType: "periodic",
      shiftDate: addDays(today, -7),
      status: "in_progress",
      startedAt: addDays(today, -7),
      startedById: adminId,
      notes: "Kiểm kê định kỳ demo",
    },
  });

  console.log("- Products:", 2);
  console.log("- Demo vouchers:", 2);
  console.log("- Demo inventory check sessions:", 2);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
