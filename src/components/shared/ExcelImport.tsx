"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type TemplateColumn = {
  key: string;
  label: string;
  required: boolean;
};

export type ImportRow = Record<string, unknown>;

type ExcelImportProps = {
  onImport: (rows: ImportRow[]) => void;
  templateColumns: TemplateColumn[];
  sampleData?: Record<string, unknown>[];
};

function normalizeHeader(input: unknown) {
  return String(input ?? "").trim();
}

function rowValue(row: ImportRow, key: string) {
  const v = row[key];
  if (v === undefined || v === null) return "";
  return typeof v === "string" ? v.trim() : v;
}

export function ExcelImport({ templateColumns, onImport, sampleData }: ExcelImportProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);

  const columnKeys = useMemo(() => new Set(templateColumns.map((c) => c.key)), [templateColumns]);

  function downloadTemplate() {
    const headerRow: Record<string, unknown> = {};
    for (const col of templateColumns) {
      headerRow[col.key] = col.label;
    }

    const sample = (sampleData?.length ? sampleData : [headerRow]).map((r) => r);
    const sheet = XLSX.utils.json_to_sheet(sample, { skipHeader: true });
    // first row: labels
    XLSX.utils.sheet_add_aoa(sheet, [templateColumns.map((c) => c.label)], { origin: "A1" });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Template");
    XLSX.writeFile(wb, "template.xlsx");
  }

  async function handleFile(file: File) {
    setGlobalErrors([]);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const parsed = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });

    const nextRowErrors: Record<number, string[]> = {};
    const nextGlobalErrors: string[] = [];

    parsed.forEach((row, idx) => {
      const errs: string[] = [];

      for (const col of templateColumns) {
        if (!col.required) continue;
        const value = rowValue(row, col.key);
        if (value === "" || (typeof value === "number" && !Number.isFinite(value))) {
          errs.push(`Thiếu "${col.label}"`);
        }
      }

      for (const k of Object.keys(row)) {
        if (!columnKeys.has(k)) {
          errs.push(`Cột không hợp lệ "${normalizeHeader(k)}"`);
        }
      }

      if (errs.length) nextRowErrors[idx] = errs;
    });

    if (!parsed.length) nextGlobalErrors.push("File không có dữ liệu.");

    setRows(parsed);
    setRowErrors(nextRowErrors);
    setGlobalErrors(nextGlobalErrors);
  }

  const totalErrors = useMemo(() => {
    return globalErrors.length + Object.values(rowErrors).reduce((sum, arr) => sum + arr.length, 0);
  }, [globalErrors, rowErrors]);

  const hasErrors = totalErrors > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Import Excel</CardTitle>
        <Button variant="outline" size="sm" type="button" onClick={downloadTemplate}>
          Tải template Excel
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

        {totalErrors ? (
          <Alert variant="destructive">
            <AlertTitle>Dữ liệu có lỗi</AlertTitle>
            <AlertDescription className="max-h-40 overflow-auto whitespace-pre-wrap">
              {globalErrors.map((e) => `- ${e}`).join("\n")}
              {Object.entries(rowErrors)
                .slice(0, 30)
                .map(([idx, errs]) => `- Dòng ${Number(idx) + 2}: ${errs.join("; ")}`)
                .join("\n")}
              {Object.keys(rowErrors).length > 30 ? `\n... và ${Object.keys(rowErrors).length - 30} dòng lỗi khác` : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        {rows.length ? (
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {templateColumns.map((c) => (
                    <TableHead key={c.key}>
                      {c.label}
                      {c.required ? <span className="text-destructive"> *</span> : null}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 20).map((r, idx) => (
                  <TableRow key={idx} className={cn(rowErrors[idx]?.length && "bg-destructive/5")}>
                    {templateColumns.map((c) => (
                      <TableCell key={c.key}>{String(rowValue(r, c.key) ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
                {rows.length > 20 ? (
                  <TableRow>
                    <TableCell colSpan={templateColumns.length} className="text-muted-foreground">
                      ... còn {rows.length - 20} dòng (đã ẩn bớt)
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {rows.length ? `${rows.length} dòng đã đọc` : "Chưa có file"}
          </div>
          <Button
            type="button"
            disabled={!rows.length || hasErrors}
            onClick={() => onImport(rows)}
          >
            Xác nhận import
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
