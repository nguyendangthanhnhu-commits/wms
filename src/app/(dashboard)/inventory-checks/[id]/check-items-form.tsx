"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CameraCapture } from "@/components/shared/CameraCapture";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  systemQty: number;
  actualQty: number | null;
  discrepancyReason: string | null;
  product: { sku: string; name: string };
  unit: { code: string };
  location?: { barcode: string | null; rack: string | null; shelf: string | null; bin: string | null } | null;
};

type Props = {
  sessionId: string;
  status: string;
  items: Item[];
};

export function CheckItemsForm({ sessionId, status, items }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<Array<{ imageUrl: string; takenAt: string }>>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [draft, setDraft] = useState(() =>
    items.map((it) => ({
      id: it.id,
      systemQty: it.systemQty,
      actualQty: it.actualQty,
      discrepancyReason: it.discrepancyReason ?? "",
    }))
  );

  const isEditable = status === "in_progress";

  const rows = useMemo(() => {
    const byId = new Map(draft.map((d) => [d.id, d]));
    return items.map((it) => {
      const d = byId.get(it.id);
      const actual = d?.actualQty ?? null;
      const diff = actual === null ? null : actual - it.systemQty;
      return { it, d, diff };
    });
  }, [items, draft]);

  async function save(action: "save" | "complete") {
    setBusy(true);
    try {
      const res = await fetch(`/api/inventory-checks/${sessionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "complete" ? { photos } : {}),
          items: draft.map((d) => ({
            id: d.id,
            actualQty: d.actualQty,
            discrepancyReason: d.discrepancyReason || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể cập nhật kiểm kê", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success(action === "complete" ? "Đã hoàn thành kiểm kê" : "Đã lưu tạm");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" disabled={!isEditable || busy} onClick={() => void save("save")}>
          Lưu tạm
        </Button>
        <Button disabled={!isEditable || busy} onClick={() => void save("complete")}>
          Hoàn thành kiểm kê
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sản phẩm</TableHead>
            <TableHead>Vị trí</TableHead>
            <TableHead className="text-right">Tồn lý thuyết</TableHead>
            <TableHead className="text-right">Tồn thực tế</TableHead>
            <TableHead className="text-right">Chênh lệch</TableHead>
            <TableHead>Giải trình</TableHead>
            <TableHead>Ảnh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ it, d, diff }) => {
            const needsReason = diff !== null && diff !== 0;
            const loc =
              it.location?.barcode ??
              [it.location?.rack, it.location?.shelf, it.location?.bin].filter(Boolean).join("-") ??
              "-";
            return (
              <TableRow key={it.id} className={cn(needsReason && "bg-destructive/5")}>
                <TableCell className="font-medium">
                  {it.product.sku} — {it.product.name}
                  <div className="text-xs text-muted-foreground">ĐVT: {it.unit.code}</div>
                </TableCell>
                <TableCell>{loc}</TableCell>
                <TableCell className="text-right">{it.systemQty}</TableCell>
                <TableCell className="text-right">
                  {isEditable ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={d?.actualQty ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        setDraft((prev) => prev.map((x) => (x.id === it.id ? { ...x, actualQty: v } : x)));
                      }}
                      className={cn("w-28 text-right", needsReason && "border-destructive")}
                    />
                  ) : (
                    it.actualQty ?? "-"
                  )}
                </TableCell>
                <TableCell className={cn("text-right", needsReason && "font-semibold text-destructive")}>
                  {diff === null ? "-" : diff}
                </TableCell>
                <TableCell className="min-w-[240px]">
                  {isEditable ? (
                    <Textarea
                      value={d?.discrepancyReason ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev.map((x) => (x.id === it.id ? { ...x, discrepancyReason: e.target.value } : x))
                        )
                      }
                      placeholder={needsReason ? "Bắt buộc nếu lệch..." : "Optional"}
                      className={cn(needsReason && !(d?.discrepancyReason ?? "").trim() && "border-destructive")}
                    />
                  ) : (
                    it.discrepancyReason ?? "-"
                  )}
                </TableCell>
                <TableCell className="min-w-[220px]">
                  {isEditable ? (
                    <div className="grid gap-2">
                      <CameraCapture
                        disabled={busy}
                        label="Chụp ảnh"
                        onCapture={(imageUrl) => {
                          const takenAt = new Date().toISOString();
                          setPhotos((prev) => [...prev, { imageUrl, takenAt }]);
                        }}
                      />
                      {photos.length ? (
                        <div className="flex flex-wrap gap-2">
                          {photos.slice(-3).map((p) => (
                            <button
                              key={p.imageUrl}
                              type="button"
                              className="overflow-hidden rounded-md border"
                              onClick={() => setPreview(p.imageUrl)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imageUrl} alt="Ảnh" className="h-12 w-12 object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {!items.length ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Chưa có dòng kiểm kê.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <Dialog open={!!preview} onOpenChange={(o) => (!o ? setPreview(null) : undefined)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ảnh kiểm kê</DialogTitle>
          </DialogHeader>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Ảnh kiểm kê" className="max-h-[70vh] w-full rounded-md object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

