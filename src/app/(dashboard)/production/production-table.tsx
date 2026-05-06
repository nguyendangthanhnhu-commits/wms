"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";

type Row = {
  id: string;
  quantity: number;
  shift: string;
  outputDate: string | Date;
  product: { sku: string; name: string };
  unit: { code: string };
  voucher: { id: string; voucherCode: string } | null;
};

export function ProductionTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "outputDate",
      header: "Ngày",
      cell: ({ row }) => new Date(row.original.outputDate).toLocaleDateString("vi-VN"),
    },
    {
      accessorKey: "product",
      header: "Sản phẩm",
      cell: ({ row }) => `${row.original.product.sku} — ${row.original.product.name}`,
    },
    {
      accessorKey: "quantity",
      header: "SL",
      cell: ({ row }) => `${row.original.quantity} ${row.original.unit.code}`,
    },
    {
      accessorKey: "shift",
      header: "Ca",
      cell: ({ row }) => <Badge variant="secondary">{String(row.original.shift)}</Badge>,
    },
    {
      accessorKey: "voucher",
      header: "Phiếu",
      cell: ({ row }) =>
        row.original.voucher ? (
          <Link prefetch className="underline underline-offset-4" href={`/vouchers/${row.original.voucher.id}`}>
            {row.original.voucher.voucherCode}
          </Link>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có dữ liệu sản xuất."
      searchPlaceholder="Tìm theo SKU/tên/ca/phiếu..."
    />
  );
}

