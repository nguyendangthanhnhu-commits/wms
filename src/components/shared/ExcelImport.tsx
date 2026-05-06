"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type ExcelColumnDef = {
  key: string;
  header: string;
  required?: boolean;
};

type ExcelImportProps = {
  templateUrl: string;
  columns: ExcelColumnDef[];
  onImport: (rows: Record<string, unknown>[]) => void;
};

export function ExcelImport({ templateUrl, columns, onImport }: ExcelImportProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const columnKeys = useMemo(() => new Set(columns.map((c) => c.key)), [columns]);

  async function handleFile(file: File) {
    setErrors([]);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const nextErrors: string[] = [];

    parsed.forEach((row, idx) => {
      columns.forEach((col) => {
        if (!col.required) return;
        const value = row[col.key];
        if (value === undefined || value === null || String(value).trim() === "") {
          nextErrors.push(`Dòng ${idx + 2}: thiếu "${col.header}"`);
        }
      });

      Object.keys(row).forEach((k) => {
        if (!columnKeys.has(k)) {
          nextErrors.push(`Dòng ${idx + 2}: cột không hợp lệ "${k}"`);
        }
      });
    });

    setRows(parsed);
    setErrors(nextErrors);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Import Excel</CardTitle>
        <Button asChild variant="outline" size="sm">
          <a href={templateUrl} target="_blank" rel="noreferrer">
            Tải template
          </a>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void handleFile(file);
          }}
        />

        {errors.length ? (
          <Alert variant="destructive">
            <AlertTitle>Dữ liệu có lỗi</AlertTitle>
            <AlertDescription className="max-h-40 overflow-auto whitespace-pre-wrap">
              {errors.slice(0, 50).join("\n")}
              {errors.length > 50 ? `\n... và ${errors.length - 50} lỗi khác` : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {rows.length ? `${rows.length} dòng đã đọc` : "Chưa có file"}
          </div>
          <Button
            type="button"
            disabled={!rows.length || errors.length > 0}
            onClick={() => onImport(rows)}
          >
            Xác nhận import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
