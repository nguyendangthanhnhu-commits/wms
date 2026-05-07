import type { SidebarNavItem } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

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
        <div className="truncate text-sm font-semibold leading-tight">
          {title ?? "Dashboard"}
        </div>
        <div className="hidden md:block">
          <Breadcrumbs />
        </div>
      </div>

      <CommandPalette navItems={navItems} />
      <Separator orientation="vertical" className="hidden h-6 md:block" />
      <NotificationBell />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
