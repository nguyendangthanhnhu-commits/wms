import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function startOfTodayUtc(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUtc(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) {
      return NextResponse.json({ needsCheck: false });
    }

    const { appUser } = current;

    if (appUser?.role !== "warehouse_keeper" && appUser?.role !== "production_staff") {
      return NextResponse.json({ needsCheck: false });
    }

    const assignments = await prisma.warehouseStaffAssignment.findMany({
      where: { userId: appUser.id },
      select: { warehouseId: true },
    });

    if (!assignments.length) {
      return NextResponse.json({ needsCheck: false });
    }

    const warehouseIds = assignments.map((a) => a.warehouseId);

    const shiftStart = startOfTodayUtc();
    const shiftEnd = endOfTodayUtc();

    const existing = await prisma.inventoryCheckSession.findFirst({
      where: {
        warehouseId: { in: warehouseIds },
        checkType: "shift_start",
        shiftDate: {
          gte: shiftStart,
          lte: shiftEnd,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ needsCheck: !existing });
  } catch (error) {
    console.error("[GET /api/inventory-checks/shift-status]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
