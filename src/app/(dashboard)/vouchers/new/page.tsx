import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NewVoucherPage() {
  return (
    <Card>
      <CardHeader>
        <PageHeader
          title="Tạo phiếu kho"
          description="Màn hình tạo phiếu sẽ được triển khai ở bước tiếp theo (POST /api/vouchers + workflow duyệt)."
          actions={
            <Button asChild variant="secondary">
              <Link href="/vouchers">Quay lại</Link>
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <EmptyState
          title="Chưa triển khai luồng tạo phiếu"
          description="Hiện tại bạn có thể xem danh sách/chi tiết phiếu demo. Bước tiếp theo: form tạo phiếu + add item + upload ảnh + approve."
        />
      </CardContent>
    </Card>
  );
}
