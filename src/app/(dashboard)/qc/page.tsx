import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listQcEvaluations } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function QcPage() {
  const evaluations = await listQcEvaluations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>QC</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phiếu</TableHead>
              <TableHead>Loại lỗi</TableHead>
              <TableHead>Hướng xử lý</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <Link prefetch className="underline underline-offset-4" href={`/qc/${e.id}`}>
                    {e.voucher.voucherCode}
                  </Link>
                </TableCell>
                <TableCell>{e.defectType}</TableCell>
                <TableCell>
                  <Badge variant={e.resolution === "pending" ? "secondary" : "default"}>{e.resolution}</Badge>
                </TableCell>
                <TableCell>{new Date(e.evaluatedAt).toLocaleString("vi-VN")}</TableCell>
              </TableRow>
            ))}
            {!evaluations.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Chưa có đánh giá QC.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
