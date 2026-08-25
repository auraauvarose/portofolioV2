import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, computeSessionValue } from "@/lib/admin-cookie";
import { ADMIN_PASSWORD, ADMIN_COOKIE_SECRET } from "@/lib/config";

function expectedSessionValue(): string {
  return computeSessionValue(ADMIN_COOKIE_SECRET || ADMIN_PASSWORD);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const loggedIn = request.cookies.get(ADMIN_COOKIE)?.value === expectedSessionValue();

  const isLoginPage = path === "/admin/login";

  if (path.startsWith("/admin") && !loggedIn && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (loggedIn && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/projects/:path*",
    "/api/certifications/:path*",
    "/api/gallery/:path*",
    "/api/upload/:path*",
  ],
};
