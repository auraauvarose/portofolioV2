import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionValue } from "@/lib/admin-cookie";
import { sessionSecret } from "@/lib/server-config";

// API routes that must NEVER be reachable without an admin session.
// Route handlers still call requireUser() themselves — this is a real second
// layer (the previous matcher listed these paths but enforced nothing).
// NOTE: /api/comments is deliberately NOT here: its public POST/GET are by
// design and guarded per-handler instead.
const PROTECTED_API_PREFIXES = [
  "/api/projects",
  "/api/certifications",
  "/api/gallery",
  "/api/upload",
];

function isProtectedApi(path: string): boolean {
  return PROTECTED_API_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const loggedIn = await verifySessionValue(
    sessionSecret(),
    request.cookies.get(ADMIN_COOKIE)?.value,
  );

  if (isProtectedApi(path) && !loggedIn) {
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
  ],
};
