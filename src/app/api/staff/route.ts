import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateStaffSchema } from "@/lib/schemas/staff";

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { employeeCode: "asc" },
      take: 500,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
        department: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(staff);
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? String((error as any).code) : "";

    if (code === "P1001" || code === "P1017") {
      return NextResponse.json({ error: "Database temporarily unavailable" }, { status: 503 });
    }

    console.error("[GET /api/staff]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = current.appUser.role;
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as unknown;
    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const input = parsed.data;

    const created = await prisma.user.create({
      data: {
        employeeCode: input.employeeCode,
        fullName: input.fullName,
        role: input.role as any,
        departmentId: input.departmentId ?? null,
        phone: input.phone?.trim() || null,
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

    console.error("[POST /api/staff]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
