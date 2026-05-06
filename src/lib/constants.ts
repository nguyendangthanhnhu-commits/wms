export const MENU_BY_ROLE = {
  admin: [
    "dashboard",
    "warehouses",
    "products",
    "vouchers",
    "inventory-checks",
    "staff",
    "bom",
    "orders",
    "production",
    "qc",
  ],
  warehouse_manager: [
    "dashboard",
    "warehouses",
    "vouchers",
    "inventory-checks",
    "orders",
  ],
  warehouse_keeper: ["dashboard", "vouchers", "inventory-checks"],
  qc_officer: ["dashboard", "qc"],
  production_staff: ["dashboard", "vouchers"],
  forklift_driver: ["dashboard", "vouchers"],
  sales: ["dashboard", "orders", "production"],
  leader: ["dashboard", "orders", "production"],
} as const satisfies Record<string, readonly string[]>;

export type AppRole = keyof typeof MENU_BY_ROLE;
