import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateSupplierSchema } from "@/lib/schemas/suppliers";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      take: 500,
      select: {
        id: true,
        code: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
        isActive: true,
      },
    });
    return NextResponse.json(suppliers);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[GET /api/suppliers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (current.appUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as unknown;
    const parsed = CreateSupplierSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;
    const created = await prisma.supplier.create({
      data: {
        code: input.code,
        name: input.name,
        contactName: input.contactName?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        isActive: input.isActive ?? true,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";
    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }
    console.error("[POST /api/suppliers]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

