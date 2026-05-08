import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";

export type AuthedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

type RouteContext<P extends Record<string, string> = Record<string, string>> = {
  params: Promise<P>;
};

type AuthedHandler<P extends Record<string, string> = Record<string, string>> = (
  request: NextRequest,
  context: RouteContext<P> & { user: AuthedUser }
) => Promise<NextResponse | Response> | NextResponse | Response;

type WithAuthOptions = {
  roles?: string[];
};

export function withAuth<P extends Record<string, string> = Record<string, string>>(
  handler: AuthedHandler<P>,
  options?: WithAuthOptions
) {
  return async (request: NextRequest, context: RouteContext<P>) => {
    try {
      const user = await getCurrentUser();
      if (!user?.appUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (options?.roles && options.roles.length > 0 && !options.roles.includes(user.appUser.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return await handler(request, { ...context, user });
    } catch (error) {
      return mapErrorToResponse(error, request);
    }
  };
}

function mapErrorToResponse(error: unknown, request: NextRequest) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (code === "P1001" || code === "P1017") {
    return NextResponse.json(
      { error: "Database temporarily unavailable. Please retry." },
      { status: 503 }
    );
  }

  if (code === "P2025") {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  if (code === "P2002") {
    return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
  }

  if (code === "P2034") {
    return NextResponse.json({ error: "Conflict, please retry" }, { status: 409 });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 }
    );
  }

  console.error(`[API Error] ${request.method} ${request.url}:`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function revalidateTags(...tags: string[]) {
  for (const tag of tags) {
    if (tag) revalidateTag(tag, "max");
  }
}
