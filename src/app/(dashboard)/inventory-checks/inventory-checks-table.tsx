"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  id: string;
  checkType: string;
  shiftDate: string | Date;
  status: string;
  warehouse: { code: string; name: string };
};

export function InventoryChecksTable({ data }: { data: Row[] }) {
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
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có phiên kiểm kê."
      searchPlaceholder="Tìm theo kho/loại/trạng thái..."
    />
  );
}

