import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>WMS — Nhà máy Pin NLMT</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/api/auth/login">Tiếp tục với Supabase</Link>
        </Button>
        <div className="text-xs text-muted-foreground">
          Flow OAuth magic-link/email sẽ được bổ sung sau khi cấu hình Supabase Auth redirect URLs.
        </div>
      </CardContent>
    </Card>
  );
}
