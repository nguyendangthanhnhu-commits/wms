import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getDefectReportDetail, getQcEvaluationByDefectReportId, listStaff, listWarehouses } from "@/lib/db-cache";
import { prisma } from "@/lib/prisma";
import { QcEvaluationForm } from "@/app/(dashboard)/qc/[id]/qc-evaluation-form";

export const dynamic = "force-dynamic";

export default async function QcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [current, defectReport, evaluation, warehouses, staff, suppliers] = await Promise.all([
    getCurrentUser(),
    getDefectReportDetail(id),
    getQcEvaluationByDefectReportId(id),
    listWarehouses(),
    listStaff(),
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
      take: 500,
    }),
  ]);

  if (!defectReport) notFound();

  const txHistory = await prisma.inventoryTransaction.findMany({
    where: { productId: defectReport.productId, lotNumber: defectReport.lotNumber ?? null },
    orderBy: { performedAt: "desc" },
    take: 50,
    select: {
      id: true,
      warehouseId: true,
      transactionType: true,
      quantity: true,
      quantityBefore: true,
      quantityAfter: true,
      performedAt: true,
      note: true,
      voucherId: true,
    },
  });

  const whById = new Map(warehouses.map((w) => [w.id, w]));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>QC</span>
            <Badge variant="secondary">{defectReport.voucher.voucherCode}</Badge>
            <Badge variant="secondary">{defectReport.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Sản phẩm:</span> {defectReport.product.sku} — {defectReport.product.name}
          </div>
          <div>
            <span className="text-muted-foreground">Số lượng:</span> {defectReport.quantity} {defectReport.unit.code}
          </div>
          <div>
            <span className="text-muted-foreground">Kho phát hiện:</span>{" "}
            {defectReport.discoveredWarehouse ? `${defectReport.discoveredWarehouse.code} — ${defectReport.discoveredWarehouse.name}` : "-"}
          </div>
          {defectReport.description ? (
            <div>
              <span className="text-muted-foreground">Mô tả:</span> {defectReport.description}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {defectReport.voucher.attachments?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Ảnh lỗi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {defectReport.voucher.attachments.map((a) => (
              <a key={a.id} href={a.imageUrl} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt="Ảnh lỗi" className="h-44 w-full object-cover transition group-hover:scale-[1.02]" />
                <div className="border-t p-2 text-xs text-muted-foreground">{new Date(a.takenAt).toLocaleString("vi-VN")}</div>
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử luân chuyển kho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {!txHistory.length ? (
            <div className="text-muted-foreground">Chưa có lịch sử.</div>
          ) : (
            <div className="grid gap-2">
              {txHistory.map((t) => {
                const wh = whById.get(t.warehouseId);
                const whLabel = wh ? `${wh.code} — ${wh.name}` : t.warehouseId;
                return (
                  <div key={t.id} className="rounded-md border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">
                        {t.transactionType} @ {whLabel}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(t.performedAt).toLocaleString("vi-VN")}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {t.quantityBefore} → {t.quantityAfter} (Δ {t.quantity})
                    </div>
                    {t.note ? <div className="mt-1 text-xs">{t.note}</div> : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {defectReport.status === "pending_qc" && current?.appUser ? (
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá QC</CardTitle>
          </CardHeader>
          <CardContent>
            <QcEvaluationForm
              defectReportId={defectReport.id}
              defectStatus={defectReport.status}
              currentUserRole={current.appUser.role}
              suppliers={suppliers}
              warehouses={warehouses as any}
              staff={staff as any}
            />
          </CardContent>
        </Card>
      ) : evaluation ? (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Loại lỗi:</span> {evaluation.defectType}
            </div>
            <div>
              <span className="text-muted-foreground">Hướng xử lý:</span> {evaluation.resolution}
            </div>
            <div>
              <span className="text-muted-foreground">Đánh giá bởi:</span> {evaluation.evaluatedBy.employeeCode} —{" "}
              {evaluation.evaluatedBy.fullName}
            </div>
            {evaluation.qcNotes ? (
              <div>
                <span className="text-muted-foreground">Ghi chú:</span> {evaluation.qcNotes}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin báo lỗi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Phiếu:</span> {defectReport.voucher.voucherCode}
          </div>
          <div>
            <span className="text-muted-foreground">Báo bởi:</span> {defectReport.reportedBy.employeeCode} —{" "}
            {defectReport.reportedBy.fullName}
          </div>
          <div>
            <span className="text-muted-foreground">Báo lúc:</span> {new Date(defectReport.reportedAt).toLocaleString("vi-VN")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
