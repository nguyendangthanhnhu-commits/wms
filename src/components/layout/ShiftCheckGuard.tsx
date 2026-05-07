"use client";

import Link from "next/link";
import { useMemo } from "react";
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

  const swrOptions = useMemo(
    () => ({
      // Ca kiểm kê không cần realtime: tránh gọi API mỗi lần đổi tab.
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: shouldGuard ? 60000 : 0,
    }),
    [shouldGuard]
  );

  const { data, isLoading } = useSWR(shouldGuard ? "/api/inventory-checks/shift-status" : null, fetcher, swrOptions);

  // Không block UI khi đang loading; chỉ block khi chắc chắn needsCheck = true.
  const needsCheck = Boolean(!isLoading && data?.needsCheck);

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
