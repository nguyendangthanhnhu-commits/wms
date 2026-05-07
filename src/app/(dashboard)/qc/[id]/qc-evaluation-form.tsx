"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

type Supplier = { id: string; code: string; name: string };
type Warehouse = { id: string; code: string; name: string; groupType: string };
type Staff = { id: string; employeeCode: string; fullName: string; role: string; isActive?: boolean };

type Props = {
  defectReportId: string;
  defectStatus: string;
  currentUserRole: string;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  staff: Staff[];
};

export function QcEvaluationForm({ defectReportId, defectStatus, currentUserRole, suppliers, warehouses, staff }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const canEvaluate = useMemo(() => {
    const allowed = currentUserRole === "admin" || currentUserRole === "qc_officer";
    return allowed && defectStatus === "pending_qc";
  }, [currentUserRole, defectStatus]);

  const [defectType, setDefectType] = useState<"original" | "production">("original");
  const [supplierId, setSupplierId] = useState<string>("");
  const [lotNumber, setLotNumber] = useState<string>("");
  const [receivedDate, setReceivedDate] = useState<string>("");
  const [responsibleWarehouseId, setResponsibleWarehouseId] = useState<string>("");
  const [responsibleUserId, setResponsibleUserId] = useState<string>("");

  const [resolution, setResolution] = useState<"return_supplier" | "destroy" | "repair_reuse" | "pending">("pending");
  const [qcNotes, setQcNotes] = useState<string>("");

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/qc/${defectReportId}/evaluate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          defectType,
          supplierId: defectType === "original" ? supplierId || undefined : undefined,
          lotNumber: defectType === "original" ? lotNumber || undefined : undefined,
          receivedDate: defectType === "original" ? receivedDate || undefined : undefined,
          responsibleWarehouseId: defectType === "production" ? responsibleWarehouseId || undefined : undefined,
          responsibleUserId: defectType === "production" ? responsibleUserId || undefined : undefined,
          resolution,
          qcNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể đánh giá QC", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã đánh giá. Linh kiện đã chuyển về Kho Lỗi.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canEvaluate) return null;

  const responsibleUsers = staff.filter((u) => u.isActive !== false);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="text-sm font-medium">Section 1 — Thông tin lỗi</div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Loại lỗi</Label>
            <Select value={defectType} onValueChange={(v) => setDefectType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Lỗi nguyên bản</SelectItem>
                <SelectItem value="production">Lỗi sản xuất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {defectType === "original" ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Nhà cung cấp</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ngày nhập</Label>
              <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Số lô</Label>
              <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Lot..." />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Kho/khâu chịu trách nhiệm</Label>
              <Select value={responsibleWarehouseId} onValueChange={setResponsibleWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kho" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nhân viên chịu trách nhiệm</Label>
              <Select value={responsibleUserId} onValueChange={setResponsibleUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {responsibleUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.employeeCode} — {u.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Section 2 — Xử lý</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Phương án</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="return_supplier">Trả NCC</SelectItem>
                <SelectItem value="destroy">Hủy bỏ</SelectItem>
                <SelectItem value="repair_reuse">Sửa tái dùng</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Ghi chú QC (bắt buộc)</Label>
          <Textarea value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} placeholder="Nhập ghi chú QC..." />
        </div>
      </div>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={busy}>Xác nhận đánh giá</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận đánh giá?</AlertDialogTitle>
              <AlertDialogDescription>Sau khi xác nhận, linh kiện sẽ được chuyển về Kho Lỗi.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
              <AlertDialogAction disabled={busy} onClick={() => void submit()}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

