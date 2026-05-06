import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function resolveRoleFromAuthUser(input: {
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const email = (input.email ?? "").toLowerCase();
  const adminEmails = parseCsv(process.env.ADMIN_EMAILS);

  if (email && adminEmails.includes(email)) return "admin";

  const metaRole = (input.metadata?.["app_role"] ?? input.metadata?.["role"]) as unknown;
  if (typeof metaRole === "string" && metaRole) return metaRole;

  return process.env.DEFAULT_ROLE?.trim() || "production_staff";
}

export async function ensurePrismaUserFromAuthUser(authUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const fullName =
    (typeof authUser.user_metadata?.["full_name"] === "string"
      ? String(authUser.user_metadata?.["full_name"])
      : authUser.email) ?? "User";

  const desiredRole = resolveRoleFromAuthUser({
    email: authUser.email,
    metadata: authUser.user_metadata ?? null,
  });

  // Generate deterministic employee code for new users
  const employeeCode = `EMP_${authUser.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  const appUser = await prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      fullName,
      isActive: true,
      ...(existing?.role ? {} : { role: desiredRole as any }),
    },
    create: {
      id: authUser.id,
      employeeCode,
      fullName,
      role: desiredRole as any,
      isActive: true,
    },
  });

  return appUser;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUser = await ensurePrismaUserFromAuthUser({
    id: user.id,
    email: user.email ?? null,
    user_metadata: (user.user_metadata ?? null) as any,
  });

  return { authUser: user, appUser };
}

export async function requireRole(roles: string[]) {
  const current = await getCurrentUser();

  if (!current?.appUser) {
    throw new Error("Unauthorized");
  }

  if (!roles.includes(current.appUser.role)) {
    throw new Error("Forbidden");
  }

  return current.appUser;
}
