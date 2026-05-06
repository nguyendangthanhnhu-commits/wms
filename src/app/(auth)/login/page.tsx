import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUserFromAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  async function loginAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextRaw = String(formData.get("next") ?? "");

    if (!email || !password) {
      redirect("/login?error=missing_credentials");
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      redirect("/login?error=invalid_credentials");
    }

    await ensurePrismaUserFromAuthUser({
      id: data.user.id,
      email: data.user.email ?? null,
      user_metadata: (data.user.user_metadata ?? null) as any,
    });

    const next =
      typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "/";

    redirect(next);
  }

  const sp = (await searchParams) ?? {};
  const nextRaw = sp["next"];
  const nextValue =
    typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "/";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>WMS — Nhà máy Pin NLMT</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={nextValue} />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Mật khẩu"
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="w-full">
            Đăng nhập
          </Button>
        </form>

        <div className="text-xs text-muted-foreground">
          Tài khoản được quản trị trên Supabase Auth (Email/Password). Sau khi đăng
          nhập lần đầu, hệ thống sẽ tạo hồ sơ người dùng trong Prisma.
        </div>
      </CardContent>
    </Card>
  );
}
