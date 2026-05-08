import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidateTags } from "@/lib/api-handler";
import { UpdateStaffSchema } from "@/lib/schemas/staff";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (current.appUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    await prisma.user.update({
      where: { id },
      data: {
        ...(input.employeeCode ? { employeeCode: input.employeeCode } : {}),
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.role ? { role: input.role as any } : {}),
        ...(input.departmentId === undefined ? {} : { departmentId: input.departmentId ?? null }),
        ...(input.phone === undefined ? {} : { phone: input.phone?.trim() || null }),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });

    revalidateTags("staff", "users");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[PATCH /api/staff/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (current.appUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    revalidateTags("staff", "users");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[DELETE /api/staff/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

