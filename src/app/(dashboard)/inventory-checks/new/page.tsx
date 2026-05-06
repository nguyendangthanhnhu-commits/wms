import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NewInventoryCheckPage() {
  return (
    <Card>
      <CardHeader>
        <PageHeader
          title="Tạo phiên kiểm kê"
          description="Màn hình tạo phiên sẽ được triển khai ở bước tiếp theo (POST /api/inventory-checks)."
          actions={
            <Button asChild variant="secondary">
              <Link href="/inventory-checks">Quay lại</Link>
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <EmptyState
          title="Chưa triển khai luồng tạo phiên"
          description="Hiện tại bạn có thể xem danh sách/chi tiết các phiên demo. Bước tiếp theo: chọn kho + loại kiểm kê + tạo items từ tồn hệ thống."
        />
      </CardContent>
    </Card>
  );
}
