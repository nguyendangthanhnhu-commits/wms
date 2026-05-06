"use client";

import { useMemo } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  nextValue: string;
  errorCode?: string | null;
  action: (formData: FormData) => void;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Đang đăng nhập...
        </span>
      ) : (
        "Đăng nhập"
      )}
    </Button>
  );
}

export function LoginForm({ nextValue, errorCode, action }: LoginFormProps) {
  const errorText = useMemo(() => {
    if (!errorCode) return null;
    if (errorCode === "missing_credentials") return "Vui lòng nhập email và mật khẩu.";
    if (errorCode === "invalid_credentials") return "Email hoặc mật khẩu không đúng.";
    return "Không thể đăng nhập. Vui lòng thử lại.";
  }, [errorCode]);

  return (
    <CardContent className="space-y-4">
      {errorText ? (
        <Alert variant="destructive">
          <AlertTitle>Đăng nhập thất bại</AlertTitle>
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      ) : null}

      <form action={action} className="space-y-3">
        <input type="hidden" name="next" value={nextValue} />
        <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <Input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="current-password"
          required
        />
        <SubmitButton />
      </form>

      <div className="text-xs text-muted-foreground">
        Tài khoản được quản trị trên Supabase Auth (Email/Password). Sau khi đăng nhập lần đầu, hệ thống sẽ tạo hồ sơ
        người dùng trong Prisma.
      </div>
    </CardContent>
  );
}

