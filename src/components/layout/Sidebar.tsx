import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  Factory,
  Home,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  href: string;
  label: string;
};

function iconForHref(href: string): LucideIcon {
  if (href === "/") return Home;
  if (href.startsWith("/warehouses")) return Boxes;
  if (href.startsWith("/products")) return Package;
  if (href.startsWith("/vouchers")) return ClipboardList;
  if (href.startsWith("/inventory-checks")) return ShieldCheck;
  if (href.startsWith("/staff")) return Users;
  if (href.startsWith("/bom")) return Boxes;
  if (href.startsWith("/orders")) return ShoppingCart;
  if (href.startsWith("/production")) return Factory;
  if (href.startsWith("/qc")) return ShieldCheck;
  return Home;
}

type SidebarProps = {
  items: SidebarNavItem[];
  pathname: string;
};

export function Sidebar({ items, pathname }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
      <div className="flex h-14 items-center gap-2 px-4 text-sm font-semibold">
        <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">W</div>
        <div className="leading-tight">
          <div>WMS</div>
          <div className="text-xs font-normal text-muted-foreground">Dashboard</div>
        </div>
      </div>
      <nav className="grid gap-1 p-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = iconForHref(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              scroll={false}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className={cn("size-4 text-muted-foreground group-hover:text-inherit", active && "text-inherit")} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
