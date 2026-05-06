import { MENU_BY_ROLE, type AppRole } from "@/lib/constants";

import type { SidebarNavItem } from "@/components/layout/Sidebar";

const LABELS: Record<string, string> = {
  dashboard: "Tổng quan",
  warehouses: "Kho",
  products: "Sản phẩm",
  vouchers: "Phiếu kho",
  "inventory-checks": "Kiểm kê",
  staff: "Nhân sự",
  bom: "BOM",
  orders: "Đơn hàng",
  production: "Sản xuất",
  qc: "QC",
};

export function getNavItemsForRole(role?: string | null): SidebarNavItem[] {
  const keys =
    role && role in MENU_BY_ROLE ? MENU_BY_ROLE[role as AppRole] : MENU_BY_ROLE.admin;

  return keys.map((key) => ({
    href: key === "dashboard" ? "/" : `/${key}`,
    label: LABELS[key] ?? key,
  }));
}
