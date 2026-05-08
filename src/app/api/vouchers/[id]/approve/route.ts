import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { revalidateTags, withAuth } from "@/lib/api-handler";
import { ApproveVoucherSchema } from "@/lib/schemas/voucher-approve";

export const PUT = withAuth(
  async (request, { params, user }) => {
    const { id } = await params;
    const body = (await request.json()) as unknown;
    const { action, note } = ApproveVoucherSchema.parse(body);

    const result = await prisma.$transaction(
      async (tx) => {
        const voucher = await tx.stockVoucher.findUnique({
          where: { id },
          select: { id: true, voucherCode: true, status: true, createdById: true, createdAt: true },
        });

        if (!voucher) {
          return { error: "Not found" as const };
        }

        if (voucher.status !== "pending") {
          return {
            error: "Voucher is not pending" as const,
            voucherCode: voucher.voucherCode,
            status: voucher.status,
          };
        }

        if (voucher.createdById === user.appUser.id) {
          return { error: "Cannot approve your own voucher" as const };
        }

        const now = new Date();
        const nextStatus = action === "approve" ? "approved" : "rejected";

        const updated = await tx.stockVoucher.update({
          where: { id },
          data: {
            status: nextStatus,
            approvedById: user.appUser.id,
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
      },
      { timeout: 10000, maxWait: 5000 }
    );

    if ("error" in result) {
      if (result.error === "Not found") return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    revalidateTags("vouchers");
    return NextResponse.json(result);
  },
  { roles: ["admin", "warehouse_manager"] }
);
