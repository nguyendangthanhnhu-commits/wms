"use client";

import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  Factory,
  Home,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { SidebarNavItem } from "@/components/layout/Sidebar";

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

type MobileNavProps = {
  items: SidebarNavItem[];
  pathname: string;
};

export function MobileNav({ items, pathname }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = useMemo(() => () => setOpen(false), []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Mở menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>WMS</SheetTitle>
        </SheetHeader>
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
                onClick={close}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className={cn("size-4 text-muted-foreground group-hover:text-inherit", active && "text-inherit")} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
