import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listWarehouses } from "@/lib/db-cache";
import { prisma } from "@/lib/prisma";
import { WarehousesCrud } from "@/app/(dashboard)/warehouses/warehouses-crud";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const [data, managers] = await Promise.all([
    listWarehouses(),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["admin", "warehouse_manager"] } },
      orderBy: { employeeCode: "asc" },
      take: 500,
      select: { id: true, employeeCode: true, fullName: true },
    }),
  ]);
  return (
    <Card>
      <CardHeader>
        <PageHeader title="Kho" description="Danh sách kho đang hoạt động" />
      </CardHeader>
      <CardContent>
        <WarehousesCrud data={data as any} managers={managers as any} />
      </CardContent>
    </Card>
  );
}
