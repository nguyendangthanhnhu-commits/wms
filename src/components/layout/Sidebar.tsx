import Link from "next/link";

import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  href: string;
  label: string;
};

type SidebarProps = {
  items: SidebarNavItem[];
  pathname: string;
};

export function Sidebar({ items, pathname }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-14 items-center px-4 text-sm font-semibold">WMS</div>
      <nav className="grid gap-1 p-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
