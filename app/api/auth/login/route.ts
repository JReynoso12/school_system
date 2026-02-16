import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { queryOne } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await queryOne<{
      id: string;
      email: string;
      passwordHash: string | null;
      firstName: string;
      lastName: string;
      role: string;
      tenantId: string;
      schoolIds: string[];
    }>(
      'SELECT id, email, "passwordHash", "firstName", "lastName", role, "tenantId", "schoolIds" FROM "User" WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "SUPER_ADMIN" | "DEPARTMENT_HEAD" | "PARENT",
      tenantId: user.tenantId,
      schoolIds: Array.isArray(user.schoolIds) ? user.schoolIds : [],
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        schoolIds: user.schoolIds,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
