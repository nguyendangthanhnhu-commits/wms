import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getVoucherDetail } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const voucher = await getVoucherDetail(id);

  if (!voucher) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>{voucher.voucherCode}</span>
            <Badge variant="secondary">{voucher.voucherType}</Badge>
            <Badge variant={voucher.status === "approved" ? "default" : "secondary"}>{voucher.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Từ kho:</span>{" "}
            {voucher.fromWarehouse ? `${voucher.fromWarehouse.code} — ${voucher.fromWarehouse.name}` : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Đến kho:</span>{" "}
            {voucher.toWarehouse ? `${voucher.toWarehouse.code} — ${voucher.toWarehouse.name}` : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Tạo bởi:</span> {voucher.createdBy.employeeCode} —{" "}
            {voucher.createdBy.fullName}
          </div>
          <div>
            <span className="text-muted-foreground">Thời gian:</span>{" "}
            {new Date(voucher.createdAt).toLocaleString("vi-VN")}
          </div>
          {voucher.notes ? (
            <div>
              <span className="text-muted-foreground">Ghi chú:</span> {voucher.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead>SL kế hoạch</TableHead>
                <TableHead>SL thực tế</TableHead>
                <TableHead>Lot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voucher.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.product.sku}</TableCell>
                  <TableCell>{it.product.name}</TableCell>
                  <TableCell>{it.unit.code}</TableCell>
                  <TableCell>{it.plannedQty}</TableCell>
                  <TableCell>{it.actualQty ?? "-"}</TableCell>
                  <TableCell>{it.lotNumber ?? "-"}</TableCell>
                </TableRow>
              ))}
              {!voucher.items.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Chưa có dòng hàng.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {voucher.defectReport ? (
        <Card>
          <CardHeader>
            <CardTitle>Báo lỗi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Trạng thái:</span> {voucher.defectReport.status}
            </div>
            <div>
              <span className="text-muted-foreground">Số lượng:</span> {voucher.defectReport.quantity} (
              {voucher.defectReport.unitId})
            </div>
            <div>
              <span className="text-muted-foreground">Mô tả:</span> {voucher.defectReport.description}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {voucher.qcEvaluation ? (
        <Card>
          <CardHeader>
            <CardTitle>Đánh giá QC</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Loại lỗi:</span> {voucher.qcEvaluation.defectType}
            </div>
            <div>
              <span className="text-muted-foreground">Hướng xử lý:</span> {voucher.qcEvaluation.resolution}
            </div>
            {voucher.qcEvaluation.qcNotes ? (
              <div>
                <span className="text-muted-foreground">Ghi chú:</span> {voucher.qcEvaluation.qcNotes}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
