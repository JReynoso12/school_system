import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production"
);

const publicPaths = ["/", "/login"];
const adminPaths = ["/admin"];
const teacherPaths = ["/teacher"];
const studentPaths = ["/student"];
const parentPaths = ["/parent"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname === p || pathname.startsWith("/api/auth"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let payload: { role: string } | null = null;
  try {
    const result = await jwtVerify(token, JWT_SECRET);
    payload = result.payload as { role: string };
  } catch {
    payload = null;
  }
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return response;
  }

  if (pathname.startsWith("/admin") && !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/teacher") && !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/student") && payload.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/parent") && payload.role !== "PARENT") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
