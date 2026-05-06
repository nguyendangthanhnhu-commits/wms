"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";

type Row = {
  employeeCode: string;
  fullName: string;
  role: string;
  department: { code: string; name: string } | null;
};

export function StaffTable({ data }: { data: Row[] }) {
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
    <FilteredDataTable
      columns={columns}
      data={data}
      emptyText="Chưa có nhân sự."
      searchPlaceholder="Tìm theo mã NV/tên/role/phòng ban..."
    />
  );
}

