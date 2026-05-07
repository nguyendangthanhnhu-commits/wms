"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Boxes,
  ClipboardList,
  Factory,
  Home,
  LogOut,
  Monitor,
  Moon,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
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
  if (href.startsWith("/suppliers")) return Truck;
  return Home;
}

type CommandPaletteProps = {
  navItems: SidebarNavItem[];
};

export function CommandPalette({ navItems }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const isCmdK =
        (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (isCmdK) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function logout() {
    setOpen(false);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        toast.error("Đăng xuất thất bại");
        return;
      }
      toast.success("Đã đăng xuất");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Đăng xuất thất bại");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden h-9 min-w-44 justify-between gap-2 text-muted-foreground md:flex"
        aria-label="Tìm kiếm nhanh"
      >
        <span className="inline-flex items-center gap-2">
          <Search className="size-4" />
          <span className="text-xs">Tìm kiếm…</span>
        </span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Tìm kiếm nhanh"
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Đi tới trang, đổi giao diện, đăng xuất…" />
        <CommandList>
          <CommandEmpty>Không có kết quả phù hợp.</CommandEmpty>

          {navItems.length > 0 ? (
            <CommandGroup heading="Điều hướng">
              {navItems.map((item) => {
                const Icon = iconForHref(item.href);
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.href}`}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    <CommandShortcut>{item.href}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          <CommandSeparator />

          <CommandGroup heading="Giao diện">
            <CommandItem value="theme light" onSelect={() => setTheme("light")}>
              <Sun className="size-4" />
              <span>Chế độ sáng</span>
            </CommandItem>
            <CommandItem value="theme dark" onSelect={() => setTheme("dark")}>
              <Moon className="size-4" />
              <span>Chế độ tối</span>
            </CommandItem>
            <CommandItem value="theme system" onSelect={() => setTheme("system")}>
              <Monitor className="size-4" />
              <span>Theo hệ thống</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Tài khoản">
            <CommandItem value="logout signout" onSelect={() => void logout()}>
              <LogOut className="size-4" />
              <span>Đăng xuất</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
