import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateVoucherSchema, type CreateVoucherInput } from "@/lib/schemas/vouchers";

function parseVoucherSeq(voucherCode: string) {
  const parts = voucherCode.split("-");
  const last = parts.at(-1) ?? "0";
  const n = Number.parseInt(last, 10);
  return Number.isFinite(n) ? n : 0;
}

async function nextVoucherCode(tx: typeof prisma, voucherType: CreateVoucherInput["voucherType"]) {
  const year = new Date().getFullYear();
  const prefix = `${voucherType}-${year}-`;

  const last = await tx.stockVoucher.findFirst({
    where: {
      voucherType,
      voucherCode: { startsWith: prefix },
    },
    orderBy: { voucherCode: "desc" },
    select: { voucherCode: true },
  });

  const next = (last?.voucherCode ? parseVoucherSeq(last.voucherCode) : 0) + 1;
  const padded = String(next).padStart(5, "0");
  return `${voucherType}-${year}-${padded}`;
}

export async function GET() {
  try {
    const vouchers = await prisma.stockVoucher.findMany({
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

    return NextResponse.json(vouchers);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/vouchers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as unknown;
    const parsed = CreateVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;

    // retry on rare unique collisions under concurrency
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const voucherCode = await nextVoucherCode(tx as any, input.voucherType);

          const shiftDate = input.shiftDate ? new Date(input.shiftDate) : undefined;

          const voucher = await tx.stockVoucher.create({
            data: {
              voucherCode,
              voucherType: input.voucherType,
              status: "pending",
              fromWarehouseId: input.fromWarehouseId,
              toWarehouseId: input.toWarehouseId,
              salesOrderId: input.salesOrderId,
              shift: input.shift,
              shiftDate,
              vehicleInfo: input.vehicleInfo,
              driverName: input.driverName,
              receiverName: input.receiverName,
              notes: input.notes,
              createdById: current.appUser.id,
              items: {
                create: input.items.map((it) => ({
                  productId: it.productId,
                  unitId: it.unitId,
                  plannedQty: it.plannedQty,
                  lotNumber: it.lotNumber,
                  note: it.note,
                })),
              },
            },
            select: { id: true, voucherCode: true, voucherType: true },
          });

          if (voucher.voucherType === "PBL") {
            const first = input.items[0];
            await tx.defectReport.create({
              data: {
                voucherId: voucher.id,
                productId: first.productId,
                quantity: first.plannedQty,
                unitId: first.unitId,
                discoveredWarehouseId: input.toWarehouseId,
                description: input.notes?.trim() || "Báo lỗi",
                lotNumber: first.lotNumber,
                status: "pending_qc",
                reportedById: current.appUser.id,
              },
              select: { id: true },
            });
          }

          return voucher;
        });

        revalidatePath("/vouchers");
        return NextResponse.json({ id: created.id, voucherCode: created.voucherCode });
      } catch (err: any) {
        // Prisma unique violation
        if (err?.code === "P2002" && attempt < 2) continue;
        throw err;
      }
    }

    return NextResponse.json({ error: "Failed to create voucher" }, { status: 500 });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[POST /api/vouchers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
