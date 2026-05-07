import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import { CheckForm } from "@/app/(dashboard)/inventory-checks/new/check-form";

export const dynamic = "force-dynamic";

export default async function NewInventoryCheckPage() {
  const current = await getCurrentUser();
  if (!current?.appUser) {
    return <div className="text-sm text-muted-foreground">Unauthorized</div>;
  }

  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true, groupType: true },
    take: 500,
  });

  return <CheckForm warehouses={warehouses} role={current.appUser.role} />;
}
