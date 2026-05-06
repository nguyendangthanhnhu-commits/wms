import type { SidebarNavItem } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/shared/NotificationBell";

type HeaderProps = {
  title?: string;
  navItems: SidebarNavItem[];
  pathname: string;
};

export function Header({ title, navItems, pathname }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileNav items={navItems} pathname={pathname} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title ?? "Dashboard"}</div>
      </div>

      <NotificationBell />
    </header>
  );
}
