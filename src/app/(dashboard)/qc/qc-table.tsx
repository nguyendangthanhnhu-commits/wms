"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  id: string;
  defectType: string;
  resolution: string;
  evaluatedAt: string | Date;
  voucher: { id: string; voucherCode: string };
};

export function QcTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "voucher",
      header: "Phiếu",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/qc/${row.original.id}`}>
          {row.original.voucher.voucherCode}
        </Link>
      ),
    },
    { accessorKey: "defectType", header: "Loại lỗi" },
    {
      accessorKey: "resolution",
      header: "Hướng xử lý",
      cell: ({ row }) => <StatusBadge status={String(row.original.resolution)} />,
    },
    {
      accessorKey: "evaluatedAt",
      header: "Thời gian",
      cell: ({ row }) => new Date(row.original.evaluatedAt).toLocaleString("vi-VN"),
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có đánh giá QC."
      searchPlaceholder="Tìm theo phiếu/loại lỗi/hướng xử lý..."
    />
  );
}

