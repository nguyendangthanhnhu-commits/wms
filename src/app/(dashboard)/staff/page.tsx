import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { listStaff } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

type Row = Awaited<ReturnType<typeof listStaff>>[number];

export default async function StaffPage() {
  const data = await listStaff();

  const columns: ColumnDef<Row>[] = [
    { accessorKey: "employeeCode", header: "Mã NV" },
    { accessorKey: "fullName", header: "Họ tên" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <StatusBadge status={String(row.original.role)} />,
    },
    {
      accessorKey: "department",
      header: "Phòng ban",
      cell: ({ row }) =>
        row.original.department ? `${row.original.department.code} — ${row.original.department.name}` : "-",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Nhân sự" description="Danh sách nhân sự đang hoạt động" />
      </CardHeader>
      <CardContent>
        <FilteredDataTable
          columns={columns}
          data={data}
          emptyText="Chưa có nhân sự."
          searchPlaceholder="Tìm theo mã NV/tên/role/phòng ban..."
        />
      </CardContent>
    </Card>
  );
}
