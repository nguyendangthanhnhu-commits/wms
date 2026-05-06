import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phiếu kho</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Từ kho</TableHead>
              <TableHead>Đến kho</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">
                  <Link className="underline underline-offset-4" href={`/vouchers/${v.id}`}>
                    {v.voucherCode}
                  </Link>
                </TableCell>
                <TableCell>{v.voucherType}</TableCell>
                <TableCell>
                  <Badge variant={v.status === "approved" ? "default" : "secondary"}>{v.status}</Badge>
                </TableCell>
                <TableCell>{v.fromWarehouse ? `${v.fromWarehouse.code} — ${v.fromWarehouse.name}` : "-"}</TableCell>
                <TableCell>{v.toWarehouse ? `${v.toWarehouse.code} — ${v.toWarehouse.name}` : "-"}</TableCell>
                <TableCell>{new Date(v.createdAt).toLocaleString("vi-VN")}</TableCell>
              </TableRow>
            ))}
            {!vouchers.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Chưa có phiếu kho.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
