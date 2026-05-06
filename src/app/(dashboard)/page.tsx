import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { getDashboardCounts } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { warehouses, products, vouchers, sessions, qc } = await getDashboardCounts();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <PageHeader
            title="WMS"
            description="Nhà máy Pin NLMT — dashboard"
            actions={
              <Button asChild variant="secondary">
                <Link href="/vouchers/new">Tạo phiếu</Link>
              </Button>
            }
          />
          <CardDescription>Nhà máy Pin NLMT — skeleton đã sẵn sàng để phát triển module.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tiếp theo: hoàn thiện seed + mapping Supabase user ↔ Prisma user + phiếu kho + kiểm kê + QC.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan dữ liệu</CardTitle>
          <CardDescription>Đếm nhanh từ database</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <div>
            <span className="text-muted-foreground">Kho:</span> {warehouses}
          </div>
          <div>
            <span className="text-muted-foreground">Sản phẩm:</span> {products}
          </div>
          <div>
            <span className="text-muted-foreground">Phiếu kho:</span> {vouchers}
          </div>
          <div>
            <span className="text-muted-foreground">Phiên kiểm kê:</span> {sessions}
          </div>
          <div>
            <span className="text-muted-foreground">QC:</span> {qc}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
