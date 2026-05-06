import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listWarehouses } from "@/lib/db-cache";
import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listWarehouses>>[number];

export default async function WarehousesPage() {
  const data = await listWarehouses();

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "code",
      header: "Mã kho",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/warehouses/${row.original.id}`}>
          {row.original.code}
        </Link>
      ),
    },
    { accessorKey: "name", header: "Tên kho" },
    {
      accessorKey: "groupType",
      header: "Nhóm",
      cell: ({ row }) => <Badge variant="secondary">{String(row.original.groupType)}</Badge>,
    },
    {
      accessorKey: "manager",
      header: "Quản lý",
      cell: ({ row }) => row.original.manager?.fullName ?? "-",
    },
  ];

  // Client-side search wrapper
  return (
    <Card>
      <CardHeader>
        <PageHeader title="Kho" description="Danh sách kho đang hoạt động" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có kho."
          searchPlaceholder="Tìm theo mã/tên/quản lý..."
        />
      </CardContent>
    </Card>
  );
}
