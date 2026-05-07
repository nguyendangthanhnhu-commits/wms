"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { QrScanner } from "@/components/shared/QrScanner";
import { cn } from "@/lib/utils";

type VoucherItem = {
  id: string;
  plannedQty: number;
  actualQty: number | null;
  lotNumber: string | null;
  note: string | null;
  product: { sku: string; name: string };
  unit: { code: string };
};

type Props = {
  voucherId: string;
  voucherCode: string;
  status: string;
  currentUserRole: string;
  items: VoucherItem[];
};

export function VoucherConfirmItems({ voucherId, voucherCode, status, currentUserRole, items }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanItemId, setScanItemId] = useState<string | null>(null);

  const [draft, setDraft] = useState(() =>
    items.map((it) => ({
      id: it.id,
      plannedQty: it.plannedQty,
      actualQty: it.actualQty ?? null,
      lotNumber: it.lotNumber ?? "",
      note: it.note ?? "",
      sku: it.product.sku,
      name: it.product.name,
      unitCode: it.unit.code,
    }))
  );

  const canConfirm = useMemo(() => {
    const allowed = currentUserRole === "admin" || currentUserRole === "warehouse_manager" || currentUserRole === "warehouse_keeper";
    return allowed && status === "approved";
  }, [currentUserRole, status]);

  const hasMissingActualQty = useMemo(() => {
    return draft.some((d) => typeof d.actualQty !== "number" || !Number.isFinite(d.actualQty) || d.actualQty <= 0);
  }, [draft]);

  async function complete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/vouchers/${voucherId}/complete`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: draft.map((d) => ({
            id: d.id,
            actualQty: d.actualQty,
            lotNumber: d.lotNumber || undefined,
            note: d.note || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể hoàn thành phiếu", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }

      toast.success("Đã hoàn thành phiếu", { description: data?.voucherCode ?? voucherCode });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canConfirm) return null;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">Xác nhận số lượng thực tế</div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={busy || hasMissingActualQty}>Hoàn thành phiếu</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận hoàn thành phiếu {voucherCode}?</AlertDialogTitle>
              <AlertDialogDescription>Tồn kho sẽ được cập nhật.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
              <AlertDialogAction disabled={busy || hasMissingActualQty} onClick={() => void complete()}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên sản phẩm</TableHead>
            <TableHead>Đơn vị</TableHead>
            <TableHead className="text-right">SL kế hoạch</TableHead>
            <TableHead className="text-right">SL thực tế</TableHead>
            <TableHead>Lô hàng</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">QR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {draft.map((d) => {
            const diff = typeof d.actualQty === "number" && Number.isFinite(d.actualQty) ? d.actualQty !== d.plannedQty : false;
            const missing = typeof d.actualQty !== "number" || !Number.isFinite(d.actualQty) || d.actualQty <= 0;
            return (
              <TableRow key={d.id} className={cn(diff && "bg-destructive/5")}>
                <TableCell className="font-medium">
                  {d.sku} — {d.name}
                </TableCell>
                <TableCell>{d.unitCode}</TableCell>
                <TableCell className="text-right">{d.plannedQty}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={d.actualQty ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setDraft((prev) => prev.map((x) => (x.id === d.id ? { ...x, actualQty: v } : x)));
                    }}
                    className={cn("w-28 text-right", (diff || missing) && "border-destructive")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.lotNumber}
                    onChange={(e) =>
                      setDraft((prev) => prev.map((x) => (x.id === d.id ? { ...x, lotNumber: e.target.value } : x)))
                    }
                    placeholder="Số lô..."
                    className={cn("min-w-[140px]", diff && "border-destructive")}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.note}
                    onChange={(e) => setDraft((prev) => prev.map((x) => (x.id === d.id ? { ...x, note: e.target.value } : x)))}
                    placeholder="Ghi chú..."
                    className="min-w-[180px]"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setScanItemId(d.id);
                      setScanOpen(true);
                    }}
                  >
                    Quét
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {!draft.length ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Chưa có dòng hàng.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <QrScanner
        isOpen={scanOpen}
        onClose={() => {
          setScanOpen(false);
          setScanItemId(null);
        }}
        onScan={(code) => {
          const rowId = scanItemId;
          if (!rowId) return;
          setDraft((prev) => prev.map((x) => (x.id === rowId ? { ...x, lotNumber: code } : x)));
          setScanOpen(false);
          setScanItemId(null);
        }}
      />
    </div>
  );
}

