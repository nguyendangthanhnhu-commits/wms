"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[dashboard error]", error);
    }
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md rounded-xl border bg-background p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hệ thống không tải được dữ liệu cho trang này. Bạn có thể thử lại hoặc quay lại trang chủ.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted-foreground">Mã lỗi: {error.digest}</p>
        ) : null}
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => reset()}>
            <RefreshCcw className="size-4" />
            Thử lại
          </Button>
          <Button asChild>
            <a href="/">Về trang chủ</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
