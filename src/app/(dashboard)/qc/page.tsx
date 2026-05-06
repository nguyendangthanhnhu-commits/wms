import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { listQcEvaluations } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listQcEvaluations>>[number];

export default async function QcPage() {
  const data = await listQcEvaluations();

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
    <Card>
      <CardHeader>
        <PageHeader title="QC" description="Danh sách đánh giá QC" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có đánh giá QC."
          searchPlaceholder="Tìm theo phiếu/loại lỗi/hướng xử lý..."
        />
      </CardContent>
    </Card>
  );
}
