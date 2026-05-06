"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

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

type MobileNavProps = {
  items: SidebarNavItem[];
  pathname: string;
};

export function MobileNav({ items, pathname }: MobileNavProps) {
  return (
    <Sheet>
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
      </SheetContent>
    </Sheet>
  );
}
