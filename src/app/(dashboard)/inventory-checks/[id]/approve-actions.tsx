"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  sessionId: string;
  status: string;
  currentUserRole: string;
};

export function ApproveInventoryCheckActions({ sessionId, status, currentUserRole }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const canApprove = useMemo(() => {
    const allowed = currentUserRole === "admin" || currentUserRole === "warehouse_manager";
    return allowed && status === "completed";
  }, [currentUserRole, status]);

  async function approve() {
    setBusy(true);
    try {
      const res = await fetch(`/api/inventory-checks/${sessionId}/approve`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Không thể phê duyệt kiểm kê", { description: data?.error ?? "Vui lòng thử lại." });
        return;
      }
      toast.success("Đã phê duyệt kiểm kê", { description: "Tồn kho đã được đồng bộ theo số liệu thực tế." });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canApprove) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={busy}>Phê duyệt</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Phê duyệt phiên kiểm kê?</AlertDialogTitle>
          <AlertDialogDescription>Phê duyệt sẽ điều chỉnh tồn kho theo số liệu thực tế.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={() => void approve()}>
            Phê duyệt
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

