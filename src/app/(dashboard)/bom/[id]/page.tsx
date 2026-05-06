import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBomVersionDetail } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function BomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bom = await getBomVersionDetail(id);
  if (!bom) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <PageHeader
            title={bom.versionName}
            description={`${bom.product.sku} — ${bom.product.name}`}
            actions={bom.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
          />
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tạo lúc: {new Date(bom.createdAt).toLocaleString("vi-VN")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PageHeader title="Danh sách linh kiện" description="Dòng BOM" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Định mức</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.component.sku}</TableCell>
                  <TableCell>{it.component.name}</TableCell>
                  <TableCell>{it.unit.code}</TableCell>
                  <TableCell className="text-right">{it.quantity}</TableCell>
                </TableRow>
              ))}
              {!bom.items.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chưa có dòng BOM.
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
