import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Compass className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">404</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Không tìm thấy trang bạn yêu cầu. Có thể trang đã bị di chuyển hoặc đường dẫn không đúng.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button asChild>
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
