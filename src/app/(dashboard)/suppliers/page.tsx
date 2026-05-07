import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { prisma } from "@/lib/prisma";
import { SuppliersCrud } from "@/app/(dashboard)/suppliers/suppliers-crud";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const data = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    take: 500,
    select: {
      id: true,
      code: true,
      name: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
    },
  });

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Nhà cung cấp" description="Danh sách nhà cung cấp đang hoạt động" />
      </CardHeader>
      <CardContent>
        <SuppliersCrud data={data as any} />
      </CardContent>
    </Card>
  );
}

