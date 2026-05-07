"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilteredDataTable } from "@/components/shared/FilteredDataTable";
import { Textarea } from "@/components/ui/textarea";
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

type Row = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export function SuppliersCrud({ data }: { data: Row[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  function resetForm() {
    setCode("");
    setName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setAddress("");
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
    setContactName(row.contactName ?? "");
    setPhone(row.phone ?? "");
    setEmail(row.email ?? "");
    setAddress(row.address ?? "");
    setOpen(true);
  }

  async function submit() {
    setBusy(true);
    try {
      const payload = {
        code,
        name,
        contactName: contactName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      };

      const res = await fetch(editing ? `/api/suppliers/${editing.id}` : "/api/suppliers", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể lưu nhà cung cấp", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success(editing ? "Đã cập nhật nhà cung cấp" : "Đã tạo nhà cung cấp");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể xóa nhà cung cấp", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã xóa (ngừng hoạt động) nhà cung cấp");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [
      { accessorKey: "code", header: "Mã" },
      { accessorKey: "name", header: "Tên" },
      { accessorKey: "contactName", header: "Liên hệ" },
      { accessorKey: "phone", header: "SĐT" },
      { accessorKey: "email", header: "Email" },
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
                  <AlertDialogTitle>Xóa nhà cung cấp?</AlertDialogTitle>
                  <AlertDialogDescription>Nhà cung cấp sẽ được chuyển sang trạng thái ngừng hoạt động (không xóa cứng).</AlertDialogDescription>
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
          Thêm nhà cung cấp
        </Button>
      </div>

      <FilteredDataTable
        columns={columns}
        data={data as any}
        emptyText="Chưa có nhà cung cấp."
        searchPlaceholder="Tìm theo mã/tên/sđt/email..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Mã</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: NCC_ABC" />
              </div>
              <div className="grid gap-2">
                <Label>Tên</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên nhà cung cấp" />
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Người liên hệ (optional)</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="CSKH..." />
              </div>
              <div className="grid gap-2">
                <Label>SĐT (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090..." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email (optional)</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Địa chỉ (optional)</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ..." />
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

