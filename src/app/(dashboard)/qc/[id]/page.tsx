import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const evaluation = await prisma.qcEvaluation.findUnique({
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

  if (!evaluation) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Đánh giá QC</span>
            <Badge variant="secondary">{evaluation.voucher.voucherCode}</Badge>
            <Badge variant="secondary">{evaluation.voucher.voucherType}</Badge>
            <Badge variant={evaluation.resolution === "pending" ? "secondary" : "default"}>{evaluation.resolution}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Loại lỗi:</span> {evaluation.defectType}
          </div>
          <div>
            <span className="text-muted-foreground">Đánh giá lúc:</span>{" "}
            {new Date(evaluation.evaluatedAt).toLocaleString("vi-VN")}
          </div>
          <div>
            <span className="text-muted-foreground">Đánh giá bởi:</span> {evaluation.evaluatedBy.employeeCode} —{" "}
            {evaluation.evaluatedBy.fullName}
          </div>
          {evaluation.supplier ? (
            <div>
              <span className="text-muted-foreground">Nhà cung cấp:</span> {evaluation.supplier.code} —{" "}
              {evaluation.supplier.name}
            </div>
          ) : null}
          {evaluation.qcNotes ? (
            <div>
              <span className="text-muted-foreground">Ghi chú:</span> {evaluation.qcNotes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Báo lỗi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Sản phẩm:</span> {evaluation.defectReport.product.sku} —{" "}
            {evaluation.defectReport.product.name}
          </div>
          <div>
            <span className="text-muted-foreground">Số lượng:</span> {evaluation.defectReport.quantity}{" "}
            {evaluation.defectReport.unit.code}
          </div>
          <div>
            <span className="text-muted-foreground">Kho phát hiện:</span>{" "}
            {evaluation.defectReport.discoveredWarehouse
              ? `${evaluation.defectReport.discoveredWarehouse.code} — ${evaluation.defectReport.discoveredWarehouse.name}`
              : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Mô tả:</span> {evaluation.defectReport.description}
          </div>
          <div>
            <span className="text-muted-foreground">Báo bởi:</span> {evaluation.defectReport.reportedBy.employeeCode} —{" "}
            {evaluation.defectReport.reportedBy.fullName}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
