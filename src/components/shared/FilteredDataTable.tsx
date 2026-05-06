"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/DataTable";
import { ToolbarSearch } from "@/components/shared/ToolbarSearch";

type FilteredDataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  emptyText?: string;
  searchPlaceholder?: string;
  searchClassName?: string;
  className?: string;
};

export function FilteredDataTable<T>({
  columns,
  data,
  emptyText,
  searchPlaceholder,
  searchClassName,
  className,
}: FilteredDataTableProps<T>) {
  const [q, setQ] = useState("");
  const qStable = useMemo(() => q, [q]);

  return (
    <div className={className}>
      <div className="grid gap-3">
        <ToolbarSearch
          value={qStable}
          onChange={setQ}
          placeholder={searchPlaceholder}
          className={searchClassName ?? "max-w-sm"}
        />
        <DataTable columns={columns} data={data} globalFilter={qStable} emptyText={emptyText} />
      </div>
    </div>
  );
}

