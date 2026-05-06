import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response: supabaseResponse } = createSupabaseMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isLoginPage = pathname.startsWith("/login");

  if (!user && !isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  supabaseResponse.headers.set("x-next-pathname", pathname);
  if (user?.id) {
    // Reuse in server components to avoid a second auth.getUser() call.
    supabaseResponse.headers.set("x-user-id", user.id);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox|api(?:/|$)).*)",
  ],
};
