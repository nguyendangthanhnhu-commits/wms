import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWarehouseDetail } from "@/lib/db-cache";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const warehouse = await getWarehouseDetail(id);
  if (!warehouse) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <PageHeader
            title={`${warehouse.code} — ${warehouse.name}`}
            description="Chi tiết kho"
            actions={<Badge variant="secondary">{String(warehouse.groupType)}</Badge>}
          />
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Quản lý:</span> {warehouse.managerId ? "Có" : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Số vị trí:</span> {warehouse.locations.length}
          </div>
          <div>
            <span className="text-muted-foreground">Dòng tồn:</span> {warehouse.inventory.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PageHeader title="Tồn kho" description="Danh sách tồn theo kho" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouse.inventory.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.product.sku}</TableCell>
                  <TableCell>{inv.product.name}</TableCell>
                  <TableCell>{inv.unit.code}</TableCell>
                  <TableCell>{inv.lotNumber ?? "-"}</TableCell>
                  <TableCell className="text-right">{inv.quantity}</TableCell>
                </TableRow>
              ))}
              {!warehouse.inventory.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Chưa có tồn kho.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
