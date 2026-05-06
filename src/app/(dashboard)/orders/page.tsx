import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { listOrders } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listOrders>>[number];

export default async function OrdersPage() {
  const data = await listOrders();

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
      cell: ({ row }) => (row.original.requiredDate ? new Date(row.original.requiredDate).toLocaleDateString("vi-VN") : "-"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Đơn hàng" description="Danh sách đơn hàng bán" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có đơn hàng."
          searchPlaceholder="Tìm theo mã đơn/khách hàng/trạng thái..."
        />
      </CardContent>
    </Card>
  );
}
