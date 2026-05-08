import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProducts } from "@/lib/db-cache";
import { prisma } from "@/lib/prisma";
import { ProductsCrud } from "@/app/(dashboard)/products/products-crud";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [data, units] = await Promise.all([
    listProducts(),
    prisma.unit.findMany({
      orderBy: { code: "asc" },
      take: 500,
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Sản phẩm" description="Danh sách sản phẩm đang hoạt động" />
      </CardHeader>
      <CardContent>
        <ProductsCrud data={data as any} units={units as any} />
      </CardContent>
    </Card>
  );
}
