import { PrismaClient, WarehouseGroup } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
