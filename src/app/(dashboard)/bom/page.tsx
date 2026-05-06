import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { Badge } from "@/components/ui/badge";
import { listBomVersions } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listBomVersions>>[number];

export default async function BomPage() {
  const data = await listBomVersions();

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "versionName",
      header: "Phiên bản",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/bom/${row.original.id}`}>
          {row.original.versionName}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Sản phẩm",
      cell: ({ row }) => `${row.original.product.sku} — ${row.original.product.name}`,
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (row.original.isActive ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>),
    },
    {
      accessorKey: "createdAt",
      header: "Tạo lúc",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <PageHeader title="BOM" description="Danh sách BOM version" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có BOM."
          searchPlaceholder="Tìm theo version/sản phẩm..."
        />
      </CardContent>
    </Card>
  );
}
