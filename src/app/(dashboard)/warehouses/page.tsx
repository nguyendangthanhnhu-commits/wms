import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listWarehouses } from "@/lib/db-cache";
import { WarehousesTable } from "@/app/(dashboard)/warehouses/warehouses-table";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const data = await listWarehouses();
  return (
    <Card>
      <CardHeader>
        <PageHeader title="Kho" description="Danh sách kho đang hoạt động" />
      </CardHeader>
      <CardContent>
        <WarehousesTable data={data as any} />
      </CardContent>
    </Card>
  );
}
