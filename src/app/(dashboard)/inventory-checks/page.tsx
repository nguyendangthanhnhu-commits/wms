import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listInventoryCheckSessions } from "@/lib/db-cache";
import { InventoryChecksTable } from "@/app/(dashboard)/inventory-checks/inventory-checks-table";

export const dynamic = "force-dynamic";

export default async function InventoryChecksPage() {
  const data = await listInventoryCheckSessions();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Kiểm kê" description="Danh sách phiên kiểm kê" />
      </CardHeader>
      <CardContent>
        <InventoryChecksTable data={data as any} />
      </CardContent>
    </Card>
  );
}
