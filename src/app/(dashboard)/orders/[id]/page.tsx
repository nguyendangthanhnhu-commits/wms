import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getOrderDetail } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await getOrderDetail(id);
  if (!order) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <PageHeader
            title={order.orderCode}
            description={order.customerName ?? "Đơn hàng"}
            actions={<StatusBadge status={String(order.status)} />}
          />
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Loại:</span> {String(order.orderType)}
          </div>
          <div>
            <span className="text-muted-foreground">Ngày cần:</span>{" "}
            {order.requiredDate ? new Date(order.requiredDate).toLocaleDateString("vi-VN") : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Tạo lúc:</span> {new Date(order.createdAt).toLocaleString("vi-VN")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PageHeader title="Dòng đơn hàng" description="Danh sách sản phẩm trong đơn" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.product.sku}</TableCell>
                  <TableCell>{it.product.name}</TableCell>
                  <TableCell>{it.unit.code}</TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                </TableRow>
              ))}
              {!order.items.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chưa có dòng.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PageHeader title="Phiếu liên quan" description="Các phiếu kho gắn với đơn hàng" />
        </CardHeader>
        <CardContent className="text-sm">
          {order.vouchers.length ? (
            <div className="grid gap-2">
              {order.vouchers.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div className="min-w-0">
                    <Link prefetch className="font-medium underline underline-offset-4" href={`/vouchers/${v.id}`}>
                      {v.voucherCode}
                    </Link>
                    <div className="text-muted-foreground">
                      {v.voucherType} • {new Date(v.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <StatusBadge status={String(v.status)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Chưa có phiếu liên quan.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
