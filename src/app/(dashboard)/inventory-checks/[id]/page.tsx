import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getInventoryCheckSessionDetail } from "@/lib/db-cache";
import { CheckItemsForm } from "@/app/(dashboard)/inventory-checks/[id]/check-items-form";
import { getCurrentUser } from "@/lib/auth";
import { ApproveInventoryCheckActions } from "@/app/(dashboard)/inventory-checks/[id]/approve-actions";

export const dynamic = "force-dynamic";

export default async function InventoryCheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const current = await getCurrentUser();
  const session = await getInventoryCheckSessionDetail(id);

  if (!session) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>
              Kiểm kê — {session.warehouse.code} ({session.warehouse.name})
            </span>
            <Badge variant="secondary">{session.checkType}</Badge>
            <Badge variant={session.status === "completed" ? "default" : "secondary"}>{session.status}</Badge>
            {current?.appUser ? (
              <ApproveInventoryCheckActions
                sessionId={session.id}
                status={session.status}
                currentUserRole={current.appUser.role}
              />
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ngày: {new Date(session.shiftDate).toLocaleString("vi-VN")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách kiểm</CardTitle>
        </CardHeader>
        <CardContent>
          {session.status === "in_progress" ? (
            <CheckItemsForm sessionId={session.id} status={session.status} items={session.items as any} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead>SL hệ thống</TableHead>
                  <TableHead>SL thực tế</TableHead>
                  <TableHead>Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.items.map((it) => (
                  <TableRow
                    key={it.id}
                    className={it.actualQty !== null && it.actualQty !== it.systemQty ? "bg-destructive/5" : undefined}
                  >
                    <TableCell className="font-medium">{it.product.sku}</TableCell>
                    <TableCell>{it.product.name}</TableCell>
                    <TableCell>
                      {it.location?.barcode ??
                        [it.location?.rack, it.location?.shelf, it.location?.bin].filter(Boolean).join("-") ??
                        "-"}
                    </TableCell>
                    <TableCell>{it.unit.code}</TableCell>
                    <TableCell>{it.systemQty}</TableCell>
                    <TableCell>{it.actualQty ?? "-"}</TableCell>
                    <TableCell>{it.discrepancyReason ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {!session.items.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      Chưa có dòng kiểm kê.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
