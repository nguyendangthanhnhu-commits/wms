import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProducts } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listProducts>>[number];

export default async function ProductsPage() {
  const data = await listProducts();

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/products/${row.original.id}`}>
          {row.original.sku}
        </Link>
      ),
    },
    { accessorKey: "name", header: "Tên" },
    {
      accessorKey: "productType",
      header: "Loại",
      cell: ({ row }) => <Badge variant="secondary">{String(row.original.productType)}</Badge>,
    },
    {
      accessorKey: "baseUnit",
      header: "ĐVT gốc",
      cell: ({ row }) => row.original.baseUnit?.code ?? "-",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Sản phẩm" description="Danh sách sản phẩm đang hoạt động" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có sản phẩm."
          searchPlaceholder="Tìm theo SKU/tên/loại..."
        />
      </CardContent>
    </Card>
  );
}
