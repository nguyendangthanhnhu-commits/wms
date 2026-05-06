import { headers } from "next/headers";

import { Header } from "@/components/layout/Header";
import { ShiftCheckGuard } from "@/components/layout/ShiftCheckGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { getAppUserForLayout } from "@/lib/db-cache";
import { getNavItemsForRole } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-next-pathname") ?? "/";
  const userIdFromMiddleware = hdrs.get("x-user-id");

  const userId = userIdFromMiddleware
    ? userIdFromMiddleware
    : (await (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        return user?.id ?? null;
      })());

  const appUser = userId
    ? await getAppUserForLayout(userId)
    : null;

  const navItems = getNavItemsForRole(appUser?.role ?? null);

  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} pathname={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={appUser?.fullName ?? "WMS"} navItems={navItems} pathname={pathname} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      <ShiftCheckGuard role={appUser?.role ?? null} />
    </div>
  );
}
