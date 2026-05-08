import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/Section";
import { StatCard } from "@/components/shared/StatCard";
import { getDashboardCounts } from "@/lib/db-cache";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { warehouses, products, vouchers, sessions, qc } = await getDashboardCounts();

  const stats = [
    { label: "Kho", value: warehouses, icon: Boxes, tone: "info" as const, href: "/warehouses" },
    { label: "Sản phẩm", value: products, icon: Package, tone: "primary" as const, href: "/products" },
    { label: "Phiếu kho", value: vouchers, icon: ClipboardList, tone: "success" as const, href: "/vouchers" },
    {
      label: "Phiên kiểm kê",
      value: sessions,
      icon: ShieldCheck,
      tone: "warning" as const,
      href: "/inventory-checks",
    },
    { label: "Linh kiện QC", value: qc, icon: ShoppingCart, tone: "danger" as const, href: "/qc" },
  ];

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Tổng quan WMS"
        description="Nhà máy Pin NLMT — bảng điều khiển kho vận"
        actions={
          <Button asChild>
            <Link href="/vouchers/new">
              <Sparkles className="size-4" />
              Tạo phiếu mới
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section
          title="Bắt đầu nhanh"
          description="Các thao tác phổ biến nhất trong vận hành kho"
          className="lg:col-span-2"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/vouchers/new">
                <ClipboardList className="size-4" /> Tạo phiếu nhập / xuất
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/inventory-checks/new">
                <ShieldCheck className="size-4" /> Tạo phiên kiểm kê
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/qc">
                <ShieldCheck className="size-4" /> Đánh giá QC
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/products">
                <Package className="size-4" /> Danh mục sản phẩm
              </Link>
            </Button>
          </div>
        </Section>

        <Section title="Mẹo sử dụng" description="Phím tắt giúp bạn thao tác nhanh">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              Nhấn{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd> +{" "}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">K</kbd> để mở
              command palette.
            </li>
            <li>Đổi giao diện sáng / tối qua nút mặt trời/mặt trăng ở header.</li>
            <li>Mọi phiếu được hoàn thành sẽ tự động cập nhật tồn kho.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
