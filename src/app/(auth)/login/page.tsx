import { redirect } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUserFromAuthUser } from "@/lib/auth";
import { LoginForm } from "@/app/(auth)/login/login-form";

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
  const errRaw = sp["error"];
  const errorCode = typeof errRaw === "string" ? errRaw : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>WMS — Nhà máy Pin NLMT</CardDescription>
      </CardHeader>
      <LoginForm nextValue={nextValue} errorCode={errorCode} action={loginAction} />
    </Card>
  );
}
