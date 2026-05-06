import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listQcEvaluations } from "@/lib/db-cache";
import { QcTable } from "@/app/(dashboard)/qc/qc-table";

export const dynamic = "force-dynamic";

export default async function QcPage() {
  const data = await listQcEvaluations();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="QC" description="Danh sách đánh giá QC" />
      </CardHeader>
      <CardContent>
        <QcTable data={data as any} />
      </CardContent>
    </Card>
  );
}
