"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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

type Props = {
  voucherId: string;
  voucherCode: string;
  status: string;
  createdById: string;
  currentUserId: string;
  currentUserRole: string;
};

export function VoucherApproveActions({
  voucherId,
  voucherCode,
  status,
  createdById,
  currentUserId,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const canAct = useMemo(() => {
    const allowed = currentUserRole === "admin" || currentUserRole === "warehouse_manager";
    return allowed && status === "pending" && createdById !== currentUserId;
  }, [currentUserRole, status, createdById, currentUserId]);

  async function act(action: "approve" | "reject", note?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/vouchers/${voucherId}/approve`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể cập nhật phiếu", { description: data?.error ? "Vui lòng thử lại." : "Lỗi hệ thống." });
        return;
      }

      toast.success(action === "approve" ? "Đã duyệt phiếu" : "Đã từ chối phiếu", {
        description: `${voucherCode} → ${data.status}`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canAct) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={busy}>Duyệt</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt phiếu {voucherCode}?</AlertDialogTitle>
            <AlertDialogDescription>Phiếu sẽ chuyển sang trạng thái approved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void act("approve")}>
              Duyệt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy}>
            Từ chối
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối phiếu {voucherCode}?</AlertDialogTitle>
            <AlertDialogDescription>Vui lòng nhập lý do (khuyến nghị).</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Lý do từ chối..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void act("reject", rejectNote)}>
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

