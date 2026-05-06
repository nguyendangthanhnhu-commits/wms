import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { listInventoryCheckSessions } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listInventoryCheckSessions>>[number];

export default async function InventoryChecksPage() {
  const data = await listInventoryCheckSessions();

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "warehouse",
      header: "Kho",
      cell: ({ row }) => `${row.original.warehouse.code} — ${row.original.warehouse.name}`,
    },
    { accessorKey: "checkType", header: "Loại" },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={String(row.original.status)} />,
    },
    {
      accessorKey: "shiftDate",
      header: "Ngày",
      cell: ({ row }) => new Date(row.original.shiftDate).toLocaleDateString("vi-VN"),
    },
    {
      id: "detail",
      header: "Chi tiết",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/inventory-checks/${row.original.id}`}>
          Mở
        </Link>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Kiểm kê" description="Danh sách phiên kiểm kê" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có phiên kiểm kê."
          searchPlaceholder="Tìm theo kho/loại/trạng thái..."
        />
      </CardContent>
    </Card>
  );
}
