"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  id: string;
  status: string;
  reportedAt: string | Date;
  quantity: number;
  lotNumber: string | null;
  product: { sku: string; name: string };
  unit: { code: string };
  voucher: { id: string; voucherCode: string };
};

export function QcTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "voucher",
      header: "Phiếu báo lỗi",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/qc/${row.original.id}`}>
          {row.original.voucher.voucherCode}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <StatusBadge status={String(row.original.status)} />,
    },
    {
      accessorKey: "product",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <div className="font-medium">{row.original.product.sku}</div>
          <div className="text-xs text-muted-foreground">{row.original.product.name}</div>
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Số lượng",
      cell: ({ row }) => `${row.original.quantity} ${row.original.unit.code}`,
    },
    { accessorKey: "lotNumber", header: "Lot" },
    {
      accessorKey: "reportedAt",
      header: "Thời gian",
      cell: ({ row }) => new Date(row.original.reportedAt).toLocaleString("vi-VN"),
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Không có linh kiện chờ đánh giá."
      searchPlaceholder="Tìm theo phiếu/SKU/tên..."
    />
  );
}

