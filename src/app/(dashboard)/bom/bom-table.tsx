"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";

type Row = {
  id: string;
  versionName: string;
  isActive: boolean;
  createdAt: string | Date;
  product: { sku: string; name: string };
};

export function BomTable({ data }: { data: Row[] }) {
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
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có BOM."
      searchPlaceholder="Tìm theo version/sản phẩm..."
    />
  );
}

