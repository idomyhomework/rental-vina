// --- PROXY — LOCALE ROUTING + ADMIN AUTH GUARD ---

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// → Next.js 16 renamed middleware.ts to proxy.ts
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Admin route guard ---
  const isAdminRoute = /^\/\w{2}\/admin(\/|$)/.test(pathname);
  const isLoginPage = /^\/\w{2}\/admin\/login$/.test(pathname);

  if (isAdminRoute && !isLoginPage) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/ru/admin/login", request.url));
    }

    // → verify token AND admin role server-side so non-admins never receive the admin bundle
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Cookie: `access_token=${token}` },
      });

      if (!res.ok) {
        return NextResponse.redirect(new URL("/ru/admin/login", request.url));
      }

      const user = (await res.json()) as { role?: string };
      if (user.role !== "admin" && user.role !== "superadmin") {
        return NextResponse.redirect(new URL("/ru/admin/login", request.url));
      }
    } catch {
      // → backend unreachable — deny access rather than serve admin UI
      return NextResponse.redirect(new URL("/ru/admin/login", request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
