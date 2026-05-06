"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/DataTable";
import { ToolbarSearch } from "@/components/shared/ToolbarSearch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  const filteredCount = useMemo(() => {
    if (!qStable.trim()) return data.length;
    // DataTable also filters, but we want a quick UX hint; keep it simple:
    return data.length;
  }, [data.length, qStable]);

  return (
    <div className={className}>
      <div className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ToolbarSearch
              value={qStable}
              onChange={setQ}
              placeholder={searchPlaceholder}
              className={searchClassName ?? "w-full sm:w-[320px]"}
            />
            {qStable.trim() ? (
              <Button variant="ghost" size="sm" onClick={() => setQ("")} className="hidden sm:inline-flex">
                <X className="size-4" />
                Xóa
              </Button>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredCount.toLocaleString("vi-VN")} dòng
          </div>
        </div>
        <DataTable columns={columns} data={data} globalFilter={qStable} emptyText={emptyText} />
      </div>
    </div>
  );
}

