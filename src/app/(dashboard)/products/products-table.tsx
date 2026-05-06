"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";

type Row = {
  id: string;
  sku: string;
  name: string;
  productType: string;
  baseUnit: { code: string } | null;
};

export function ProductsTable({ data }: { data: Row[] }) {
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <Link prefetch className="underline underline-offset-4" href={`/products/${row.original.id}`}>
          {row.original.sku}
        </Link>
      ),
    },
    { accessorKey: "name", header: "Tên" },
    {
      accessorKey: "productType",
      header: "Loại",
      cell: ({ row }) => <Badge variant="secondary">{String(row.original.productType)}</Badge>,
    },
    {
      accessorKey: "baseUnit",
      header: "ĐVT gốc",
      cell: ({ row }) => row.original.baseUnit?.code ?? "-",
    },
  ];

  return (
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có sản phẩm."
      searchPlaceholder="Tìm theo SKU/tên/loại..."
    />
  );
}

