import { NextRequest, NextResponse } from "next/server";

const STUDENT_PREFIXES = ["/learn", "/topics", "/question-maker", "/profile"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old admin login URL to the unified login page
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookie = request.cookies.get("session");

  if (pathname.startsWith("/admin") && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (STUDENT_PREFIXES.some((p) => pathname.startsWith(p)) && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/learn/:path*",
    "/topics/:path*",
    "/question-maker/:path*",
    "/profile/:path*",
  ],
};
