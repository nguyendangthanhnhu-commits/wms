import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listOrders } from "@/lib/db-cache";
import { OrdersTable } from "@/app/(dashboard)/orders/orders-table";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const data = await listOrders();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Đơn hàng" description="Danh sách đơn hàng bán" />
      </CardHeader>
      <CardContent>
        <OrdersTable data={data as any} />
      </CardContent>
    </Card>
  );
}
