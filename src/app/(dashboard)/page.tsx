import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>WMS</CardTitle>
          <CardDescription>Nhà máy Pin NLMT — skeleton đã sẵn sàng để phát triển module.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tiếp theo: hoàn thiện seed + mapping Supabase user ↔ Prisma user + phiếu kho + kiểm kê + QC.
        </CardContent>
      </Card>
    </div>
  );
}
