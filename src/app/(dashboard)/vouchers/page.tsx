import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { listVouchers } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listVouchers>>[number];

export default async function VouchersPage() {
  const data = await listVouchers();

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
    <Card>
      <CardHeader>
        <PageHeader title="Phiếu kho" description="Danh sách phiếu kho (demo)" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có phiếu kho."
          searchPlaceholder="Tìm theo mã/loại/trạng thái/kho..."
        />
      </CardContent>
    </Card>
  );
}
