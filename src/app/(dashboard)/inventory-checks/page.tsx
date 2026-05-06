import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryChecksPage() {
  const sessions = await prisma.inventoryCheckSession.findMany({
    orderBy: { shiftDate: "desc" },
    take: 200,
    select: {
      id: true,
      checkType: true,
      shiftDate: true,
      status: true,
      warehouse: { select: { code: true, name: true } },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kiểm kê</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kho</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {s.warehouse.code} — {s.warehouse.name}
                </TableCell>
                <TableCell>{s.checkType}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge>
                </TableCell>
                <TableCell>{new Date(s.shiftDate).toLocaleDateString("vi-VN")}</TableCell>
                <TableCell>
                  <Link className="underline underline-offset-4" href={`/inventory-checks/${s.id}`}>
                    Mở
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!sessions.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Chưa có phiên kiểm kê.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
