import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { Badge } from "@/components/ui/badge";
import { listProductionOutputs } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listProductionOutputs>>[number];

export default async function ProductionPage() {
  const data = await listProductionOutputs();

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
    <Card>
      <CardHeader>
        <PageHeader title="Sản xuất" description="Sản lượng theo ca" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có dữ liệu sản xuất."
          searchPlaceholder="Tìm theo SKU/tên/ca/phiếu..."
        />
      </CardContent>
    </Card>
  );
}
