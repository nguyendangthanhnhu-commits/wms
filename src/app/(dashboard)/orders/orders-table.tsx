"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  id: string;
  orderCode: string;
  orderType: string;
  status: string;
  customerName: string | null;
  requiredDate: string | Date | null;
};

export function OrdersTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "orderCode",
      header: "Mã đơn",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/orders/${row.original.id}`}>
          {row.original.orderCode}
        </Link>
      ),
    },
    { accessorKey: "customerName", header: "Khách hàng" },
    {
      accessorKey: "orderType",
      header: "Loại",
      cell: ({ row }) => <span className="capitalize">{String(row.original.orderType)}</span>,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={String(row.original.status)} />,
    },
    {
      accessorKey: "requiredDate",
      header: "Ngày cần",
      cell: ({ row }) =>
        row.original.requiredDate ? new Date(row.original.requiredDate).toLocaleDateString("vi-VN") : "-",
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có đơn hàng."
      searchPlaceholder="Tìm theo mã đơn/khách hàng/trạng thái..."
    />
  );
}

