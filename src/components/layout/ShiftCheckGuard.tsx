"use client";

import Link from "next/link";
import useSWR from "swr";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
  });

type ShiftCheckGuardProps = {
  role?: string | null;
};

export function ShiftCheckGuard({ role }: ShiftCheckGuardProps) {
  const shouldGuard = role === "warehouse_keeper" || role === "production_staff";

  const { data } = useSWR(shouldGuard ? "/api/inventory-checks/shift-status" : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const needsCheck = Boolean(data?.needsCheck);

  return (
    <Dialog open={shouldGuard && needsCheck}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Kiểm kê bắt buộc</DialogTitle>
          <DialogDescription>
            Ca hiện tại chưa có phiên kiểm kê. Vui lòng thực hiện kiểm kê trước khi tiếp tục.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button asChild>
            <Link href="/inventory-checks/new">Bắt đầu kiểm kê ngay</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
