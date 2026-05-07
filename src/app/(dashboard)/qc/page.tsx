import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listDefectReportsPendingQc } from "@/lib/db-cache";
import { QcTable } from "@/app/(dashboard)/qc/qc-table";

export const dynamic = "force-dynamic";

export default async function QcPage() {
  const data = await listDefectReportsPendingQc();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="QC" description="Danh sách linh kiện chờ đánh giá" />
      </CardHeader>
      <CardContent>
        <QcTable data={data as any} />
      </CardContent>
    </Card>
  );
}
