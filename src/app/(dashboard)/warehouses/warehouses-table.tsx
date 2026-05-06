"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";

type Row = {
  id: string;
  code: string;
  name: string;
  groupType: string;
  manager: { fullName: string } | null;
};

export function WarehousesTable({ data }: { data: Row[] }) {
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

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có kho."
      searchPlaceholder="Tìm theo mã/tên/quản lý..."
    />
  );
}

