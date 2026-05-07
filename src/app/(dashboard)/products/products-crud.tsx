"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Unit = { id: string; code: string; name: string };

type Row = {
  id: string;
  sku: string;
  name: string;
  productType: string;
  baseUnit: { code: string } | null;
};

export function ProductsCrud({ data, units }: { data: Row[]; units: Unit[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("component");
  const [baseUnitId, setBaseUnitId] = useState<string>("");
  const [minStockLevel, setMinStockLevel] = useState<string>("0");

  const unitByCode = useMemo(() => new Map(units.map((u) => [u.code, u])), [units]);

  function resetForm() {
    setSku("");
    setName("");
    setProductType("component");
    setBaseUnitId(units[0]?.id ?? "");
    setMinStockLevel("0");
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setSku(row.sku);
    setName(row.name);
    setProductType(row.productType);
    const u = row.baseUnit?.code ? unitByCode.get(row.baseUnit.code) : undefined;
    setBaseUnitId(u?.id ?? units[0]?.id ?? "");
    setMinStockLevel("0");
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const payload = {
        sku,
        name,
        productType,
        baseUnitId,
        minStockLevel: Number(minStockLevel || "0"),
      };

      const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể lưu sản phẩm", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể xóa sản phẩm", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã xóa (ngừng hoạt động) sản phẩm");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: "sku",
        header: "SKU",
      },
      { accessorKey: "name", header: "Tên" },
      {
        accessorKey: "productType",
        header: "Loại",
        cell: ({ row }: any) => <Badge variant="secondary">{String(row.original.productType)}</Badge>,
      },
      {
        accessorKey: "baseUnit",
        header: "ĐVT gốc",
        cell: ({ row }: any) => row.original.baseUnit?.code ?? "-",
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }: any) => (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => openEdit(row.original)} disabled={busy}>
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon" disabled={busy}>
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sản phẩm sẽ được chuyển sang trạng thái ngừng hoạt động (không xóa cứng).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
                  <AlertDialogAction disabled={busy} onClick={() => void remove(row.original.id)}>
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ];
    return cols as any;
  }, [busy, unitByCode]);

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm sản phẩm
        </Button>
      </div>

      <FilteredDataTable
        columns={columns}
        data={data as any}
        emptyText="Chưa có sản phẩm."
        searchPlaceholder="Tìm theo SKU/tên/loại..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="VD: LK-PIN-01" />
            </div>
            <div className="grid gap-2">
              <Label>Tên</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên sản phẩm" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Loại</Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="component">component</SelectItem>
                    <SelectItem value="consumable">consumable</SelectItem>
                    <SelectItem value="tool">tool</SelectItem>
                    <SelectItem value="finished_good">finished_good</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>ĐVT gốc</Label>
                <Select value={baseUnitId} onValueChange={setBaseUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.code} — {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tồn tối thiểu</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Hủy
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={busy}>
                {busy ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

