"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  warehouses: "Kho",
  products: "Sản phẩm",
  suppliers: "Nhà cung cấp",
  vouchers: "Phiếu kho",
  "inventory-checks": "Kiểm kê",
  staff: "Nhân sự",
  bom: "BOM",
  orders: "Đơn hàng",
  production: "Sản xuất",
  qc: "QC",
  new: "Tạo mới",
};

function labelFor(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^[0-9a-fA-F-]{8,}$/.test(segment)) return "Chi tiết";
  return segment.replace(/[-_]/g, " ");
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className={cn("text-xs text-muted-foreground", className)}>
        <span className="inline-flex items-center gap-1">
          <Home className="size-3.5" />
          Tổng quan
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <Home className="size-3.5" />
            <span>Trang chủ</span>
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          return (
            <li key={href} className="inline-flex items-center gap-1">
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
              {isLast ? (
                <span className="font-medium capitalize text-foreground">{labelFor(segment)}</span>
              ) : (
                <Link href={href} className="capitalize hover:text-foreground">
                  {labelFor(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
