import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  tenantId: string;
  schoolIds: string[];
  exp?: number;
  iat?: number;
}

export function signToken(payload: Omit<JWTPayload, "exp" | "iat">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(allowedRoles: Role[]) {
  return async (session: JWTPayload | null) => {
    if (!session) throw new Error("Unauthorized");
    if (!allowedRoles.includes(session.role)) throw new Error("Forbidden");
    return session;
  };
}
