"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  id: string;
  voucherCode: string;
  voucherType: string;
  status: string;
  createdAt: string | Date;
  fromWarehouse: { code: string; name: string } | null;
  toWarehouse: { code: string; name: string } | null;
};

export function VouchersTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "voucherCode",
      header: "Mã phiếu",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/vouchers/${row.original.id}`}>
          {row.original.voucherCode}
        </Link>
      ),
    },
    { accessorKey: "voucherType", header: "Loại" },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={String(row.original.status)} />,
    },
    {
      accessorKey: "fromWarehouse",
      header: "Từ kho",
      cell: ({ row }) =>
        row.original.fromWarehouse ? `${row.original.fromWarehouse.code} — ${row.original.fromWarehouse.name}` : "-",
    },
    {
      accessorKey: "toWarehouse",
      header: "Đến kho",
      cell: ({ row }) =>
        row.original.toWarehouse ? `${row.original.toWarehouse.code} — ${row.original.toWarehouse.name}` : "-",
    },
    {
      accessorKey: "createdAt",
      header: "Thời gian",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("vi-VN"),
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có phiếu kho."
      searchPlaceholder="Tìm theo mã/loại/trạng thái/kho..."
    />
  );
}

