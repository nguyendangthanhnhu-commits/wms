import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApproveVoucherSchema } from "@/lib/schemas/voucher-approve";

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin" && role !== "warehouse_manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = ApproveVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { action, note } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.stockVoucher.findUnique({
        where: { id },
        select: { id: true, voucherCode: true, status: true, createdById: true, createdAt: true },
      });

      if (!voucher) {
        return { error: "Not found" as const };
      }

      if (voucher.status !== "pending") {
        return { error: "Voucher is not pending" as const, voucherCode: voucher.voucherCode, status: voucher.status };
      }

      if (voucher.createdById === current.appUser.id) {
        return { error: "Cannot approve your own voucher" as const };
      }

      const now = new Date();
      const nextStatus = action === "approve" ? "approved" : "rejected";

      const updated = await tx.stockVoucher.update({
        where: { id },
        data: {
          status: nextStatus,
          approvedById: current.appUser.id,
          approvedAt: now,
          ...(action === "reject" && note?.trim()
            ? { notes: voucher.status ? `${note.trim()}` : note.trim() }
            : {}),
        },
        select: { voucherCode: true, status: true },
      });

      await tx.systemNotification.create({
        data: {
          targetUserId: voucher.createdById,
          title: action === "approve" ? "Phiếu đã được duyệt" : "Phiếu bị từ chối",
          body:
            action === "approve"
              ? `Phiếu ${updated.voucherCode} đã được duyệt.`
              : `Phiếu ${updated.voucherCode} bị từ chối.${note?.trim() ? ` Lý do: ${note.trim()}` : ""}`,
          type: action === "approve" ? "voucher_approved" : "voucher_rejected",
          refId: voucher.id,
          refType: "StockVoucher",
        },
        select: { id: true },
      });

      return { success: true as const, voucherCode: updated.voucherCode, status: updated.status };
    });

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[PUT /api/vouchers/[id]/approve]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
