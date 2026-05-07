import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { listDepartments, listStaff } from "@/lib/db-cache";
import { StaffCrud } from "@/app/(dashboard)/staff/staff-crud";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const [data, departments] = await Promise.all([listStaff(), listDepartments()]);

  return (
    <Card>
      <CardHeader>
        <PageHeader title="Nhân sự" description="Danh sách nhân sự đang hoạt động" />
      </CardHeader>
      <CardContent>
        <StaffCrud data={data as any} departments={departments as any} />
      </CardContent>
    </Card>
  );
}
