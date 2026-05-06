import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listVouchers } from "@/lib/db-cache";
import { VouchersTable } from "@/app/(dashboard)/vouchers/vouchers-table";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const data = await listVouchers();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Phiếu kho" description="Danh sách phiếu kho (demo)" />
      </CardHeader>
      <CardContent>
        <VouchersTable data={data as any} />
      </CardContent>
    </Card>
  );
}
