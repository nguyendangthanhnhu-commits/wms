import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listStaff } from "@/lib/db-cache";
import { StaffTable } from "@/app/(dashboard)/staff/staff-table";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const data = await listStaff();

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Nhân sự" description="Danh sách nhân sự đang hoạt động" />
      </CardHeader>
      <CardContent>
        <StaffTable data={data as any} />
      </CardContent>
    </Card>
  );
}
