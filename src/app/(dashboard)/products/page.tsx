import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProducts } from "@/lib/db-cache";
import { ProductsTable } from "@/app/(dashboard)/products/products-table";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const data = await listProducts();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Sản phẩm" description="Danh sách sản phẩm đang hoạt động" />
      </CardHeader>
      <CardContent>
        <ProductsTable data={data as any} />
      </CardContent>
    </Card>
  );
}
