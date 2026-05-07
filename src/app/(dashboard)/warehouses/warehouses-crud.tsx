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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type Manager = { id: string; employeeCode: string; fullName: string };

type Row = {
  id: string;
  code: string;
  name: string;
  groupType: string;
  sortOrder: number;
  manager: { fullName: string } | null;
  managerId?: string | null;
};

export function WarehousesCrud({ data, managers }: { data: Row[]; managers: Manager[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("production");
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [description, setDescription] = useState<string>("");

  function resetForm() {
    setCode("");
    setName("");
    setGroupType("production");
    setSortOrder("0");
    setManagerId("__none__");
    setDescription("");
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setGroupType(row.groupType);
    setSortOrder(String(row.sortOrder ?? 0));
    setManagerId(String((row as any).managerId ?? ""));
    setDescription(String((row as any).description ?? ""));
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const payload = {
        code,
        name,
        groupType,
        sortOrder: Number(sortOrder || "0"),
        managerId: managerId === "__none__" ? undefined : managerId,
        description: description || undefined,
      };

      const res = await fetch(editing ? `/api/warehouses/${editing.id}` : "/api/warehouses", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể lưu kho", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success(editing ? "Đã cập nhật kho" : "Đã tạo kho");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể xóa kho", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã xóa (ngừng hoạt động) kho");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [
      { accessorKey: "code", header: "Mã kho" },
      { accessorKey: "name", header: "Tên kho" },
      {
        accessorKey: "groupType",
        header: "Nhóm",
        cell: ({ row }: any) => <Badge variant="secondary">{String(row.original.groupType)}</Badge>,
      },
      {
        accessorKey: "manager",
        header: "Quản lý",
        cell: ({ row }: any) => row.original.manager?.fullName ?? "-",
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
                  <AlertDialogTitle>Xóa kho?</AlertDialogTitle>
                  <AlertDialogDescription>Kho sẽ được chuyển sang trạng thái ngừng hoạt động (không xóa cứng).</AlertDialogDescription>
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
  }, [busy]);

  return (
    <div className="grid gap-3">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Thêm kho
        </Button>
      </div>

      <FilteredDataTable
        columns={columns}
        data={data as any}
        emptyText="Chưa có kho."
        searchPlaceholder="Tìm theo mã/tên/quản lý..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa kho" : "Thêm kho"}</DialogTitle>
            <DialogDescription>Nhập thông tin kho và bấm Lưu để áp dụng thay đổi.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Mã kho</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: KHO_SX_01" />
              </div>
              <div className="grid gap-2">
                <Label>Tên kho</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên kho" />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nhóm</Label>
                <Select value={groupType} onValueChange={setGroupType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="component">component</SelectItem>
                    <SelectItem value="finished_good">finished_good</SelectItem>
                    <SelectItem value="production">production</SelectItem>
                    <SelectItem value="quality">quality</SelectItem>
                    <SelectItem value="defect">defect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Sort order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Quản lý (optional)</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quản lý" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.employeeCode} — {m.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Mô tả (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả..." />
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

