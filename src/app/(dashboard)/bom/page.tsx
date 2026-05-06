import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listBomVersions } from "@/lib/db-cache";
import { BomTable } from "@/app/(dashboard)/bom/bom-table";

export const dynamic = "force-dynamic";

export default async function BomPage() {
  const data = await listBomVersions();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="BOM" description="Danh sách BOM version" />
      </CardHeader>
      <CardContent>
        <BomTable data={data as any} />
      </CardContent>
    </Card>
  );
}
