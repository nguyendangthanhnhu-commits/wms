"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

type Department = { id: string; code: string; name: string };

type Row = {
  id: string;
  employeeCode: string;
  fullName: string;
  role: string;
  department: { code: string; name: string } | null;
};

const roleOptions = [
  "admin",
  "warehouse_manager",
  "warehouse_keeper",
  "qc_officer",
  "production_staff",
  "forklift_driver",
  "sales",
  "leader",
] as const;

export function StaffCrud({ data, departments }: { data: Row[]; departments: Department[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]>("production_staff");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  function resetForm() {
    setEmployeeCode("");
    setFullName("");
    setRole("production_staff");
    setDepartmentId("");
    setPhone("");
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    setEmployeeCode(row.employeeCode);
    setFullName(row.fullName);
    setRole(row.role as any);
    setDepartmentId("");
    setPhone("");
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const payload = {
        employeeCode,
        fullName,
        role,
        departmentId: departmentId || undefined,
        phone: phone || undefined,
      };

      const res = await fetch(editing ? `/api/staff/${editing.id}` : "/api/staff", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể lưu nhân sự", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success(editing ? "Đã cập nhật nhân sự" : "Đã tạo nhân sự");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể xóa nhân sự", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã xóa (ngừng hoạt động) nhân sự");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [
      { accessorKey: "employeeCode", header: "Mã NV" },
      { accessorKey: "fullName", header: "Họ tên" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }: any) => <StatusBadge status={String(row.original.role)} />,
      },
      {
        accessorKey: "department",
        header: "Phòng ban",
        cell: ({ row }: any) =>
          row.original.department ? `${row.original.department.code} — ${row.original.department.name}` : "-",
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
                  <AlertDialogTitle>Xóa nhân sự?</AlertDialogTitle>
                  <AlertDialogDescription>Nhân sự sẽ được chuyển sang trạng thái ngừng hoạt động (không xóa cứng).</AlertDialogDescription>
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
          Thêm nhân sự
        </Button>
      </div>

      <FilteredDataTable
        columns={columns}
        data={data as any}
        emptyText="Chưa có nhân sự."
        searchPlaceholder="Tìm theo mã NV/tên/role/phòng ban..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa nhân sự" : "Thêm nhân sự"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Mã NV</Label>
                <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="VD: NV001" />
              </div>
              <div className="grid gap-2">
                <Label>Họ tên</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ tên" />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Phòng ban (optional)</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>SĐT (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." />
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

