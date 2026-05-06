import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getProductDetail } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await getProductDetail(id);
  if (!product) notFound();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <PageHeader
            title={`${product.sku} — ${product.name}`}
            description="Thông tin sản phẩm"
            actions={<Badge variant="secondary">{String(product.productType)}</Badge>}
          />
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">ĐVT gốc:</span> {product.baseUnit.code}
          </div>
          <div>
            <span className="text-muted-foreground">Danh mục:</span>{" "}
            {product.category ? `${product.category.code} — ${product.category.name}` : "-"}
          </div>
          <div>
            <span className="text-muted-foreground">Trạng thái:</span> {product.isActive ? "Hoạt động" : "Ngừng"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PageHeader title="Nhà cung cấp" description="Danh sách NCC theo sản phẩm" />
        </CardHeader>
        <CardContent className="text-sm">
          {product.suppliers.length ? (
            <div className="grid gap-2">
              {product.suppliers.map((ps) => (
                <div key={ps.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {ps.supplier.code} — {ps.supplier.name}
                    </div>
                    <div className="text-muted-foreground">
                      {ps.supplierSku ? `SKU NCC: ${ps.supplierSku}` : "SKU NCC: -"}
                    </div>
                  </div>
                  {ps.isDefault ? <Badge>Default</Badge> : <Badge variant="outline">—</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Chưa có nhà cung cấp.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
