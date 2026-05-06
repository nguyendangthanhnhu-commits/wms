import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listProductionOutputs } from "@/lib/db-cache";
import { ProductionTable } from "@/app/(dashboard)/production/production-table";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const data = await listProductionOutputs();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Sản xuất" description="Sản lượng theo ca" />
      </CardHeader>
      <CardContent>
        <ProductionTable data={data as any} />
      </CardContent>
    </Card>
  );
}
