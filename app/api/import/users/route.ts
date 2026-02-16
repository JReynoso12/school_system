import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcrypt";
import Papa from "papaparse";

const DEFAULT_PASSWORD = "TempPassword123!";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const schoolId = formData.get("schoolId") as string;
    const role = (formData.get("role") as string) || "STUDENT";

    if (!file || !schoolId) {
      return NextResponse.json(
        { error: "File and schoolId are required" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsed = Papa.parse<{ email: string; firstName: string; lastName: string }>(
      text,
      { header: true }
    );

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid CSV format", details: parsed.errors },
        { status: 400 }
      );
    }

    const rows = parsed.data.filter(
      (r) => r.email?.trim() && r.firstName?.trim() && r.lastName?.trim()
    );
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const created: string[] = [];
    for (const row of rows) {
      const email = row.email.trim().toLowerCase();
      const existing = await queryOne('SELECT id FROM "User" WHERE email = $1', [email]);
      if (existing) continue;

      const userRes = await query<{ id: string }>(
        `INSERT INTO "User" (email, "passwordHash", "firstName", "lastName", role, "tenantId", "schoolIds")
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [email, passwordHash, row.firstName.trim(), row.lastName.trim(), role, session.tenantId, [schoolId]]
      );
      const userId = userRes.rows[0].id;

      await query(
        `INSERT INTO "UserSchoolAssignment" ("userId", "schoolId", role)
         VALUES ($1, $2, $3)
         ON CONFLICT ("userId", "schoolId") DO NOTHING`,
        [userId, schoolId, role]
      );
      created.push(email);
    }

    return NextResponse.json({
      success: true,
      imported: created.length,
      total: rows.length,
      skipped: rows.length - created.length,
    });
  } catch (err) {
    console.error("Import users error:", err);
    return NextResponse.json(
      { error: "Failed to import users" },
      { status: 500 }
    );
  }
}
