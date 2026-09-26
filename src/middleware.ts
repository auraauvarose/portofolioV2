import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionValue } from "@/lib/admin-cookie";
import { sessionSecret } from "@/lib/server-config";

const PROTECTED_API_PREFIXES = [
  "/api/projects",
  "/api/certifications",
  "/api/gallery",
  "/api/upload",
  "/api/site-content",
  "/api/experience",
  "/api/testimonials",
];

const PUBLIC_POST_ONLY = ["/api/contact", "/api/analytics"];

function isProtectedApi(path: string): boolean {
  return PROTECTED_API_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

function isAdminOnlyApi(path: string, method: string): boolean {
  if (isProtectedApi(path)) return true;
  if (PUBLIC_POST_ONLY.includes(path)) return method !== "POST";
  return false;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const loggedIn = await verifySessionValue(
    sessionSecret(),
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (isAdminOnlyApi(path, request.method) && !loggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    "/api/site-content/:path*",
    "/api/experience/:path*",
    "/api/testimonials/:path*",
    "/api/analytics",
    "/api/contact",
  ],
};
