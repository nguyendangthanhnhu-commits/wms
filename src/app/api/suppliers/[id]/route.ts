import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UpdateSupplierSchema } from "@/lib/schemas/suppliers";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (current.appUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;
    const body = (await request.json()) as unknown;
    const parsed = UpdateSupplierSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    await prisma.supplier.update({
      where: { id },
      data: {
        ...(input.code ? { code: input.code } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.contactName === undefined ? {} : { contactName: input.contactName?.trim() || null }),
        ...(input.phone === undefined ? {} : { phone: input.phone?.trim() || null }),
        ...(input.email === undefined ? {} : { email: input.email?.trim() || null }),
        ...(input.address === undefined ? {} : { address: input.address?.trim() || null }),
        ...(typeof input.isActive === "boolean" ? { isActive: input.isActive } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[PATCH /api/suppliers/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (current.appUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
      select: { id: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[DELETE /api/suppliers/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

