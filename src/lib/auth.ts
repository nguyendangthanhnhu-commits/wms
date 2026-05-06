import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const appUser = await prisma.user.findUnique({
    where: { id: user.id },
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
