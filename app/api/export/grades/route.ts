import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectionId = searchParams.get("sectionId");
  const termId = searchParams.get("termId");

  if (!sectionId && !termId) {
    return NextResponse.json(
      { error: "sectionId or termId required" },
      { status: 400 }
    );
  }

  if (session.role === "TEACHER" && sectionId) {
    const section = await queryOne('SELECT id FROM "Section" WHERE id = $1 AND "teacherId" = $2', [
      sectionId,
      session.userId,
    ]);
    if (!section) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  let gradesRes;
  if (sectionId) {
    gradesRes = await query(
      `SELECT g.*, u.email, u."firstName", u."lastName", sb.name as "subjectName", sb.code as "subjectCode",
        ay.name as "termName", gc.name as "categoryName"
       FROM "Grade" g
       JOIN "User" u ON g."studentId" = u.id
       JOIN "Subject" sb ON g."subjectId" = sb.id
       JOIN "Term" t ON g."termId" = t.id
       JOIN "AcademicYear" ay ON t."academicYearId" = ay.id
       JOIN "School" s ON ay."schoolId" = s.id
       JOIN "District" d ON s."districtId" = d.id
       LEFT JOIN "GradeCategory" gc ON g."categoryId" = gc.id
       WHERE d."tenantId" = $1 AND EXISTS (
         SELECT 1 FROM "Enrollment" e WHERE e."studentId" = g."studentId" AND e."sectionId" = $2
       )${termId ? " AND g.\"termId\" = $3" : ""}`,
      termId ? [session.tenantId, sectionId, termId] : [session.tenantId, sectionId]
    );
  } else {
    gradesRes = await query(
      `SELECT g.*, u.email, u."firstName", u."lastName", sb.name as "subjectName", sb.code as "subjectCode",
        ay.name as "termName", gc.name as "categoryName"
       FROM "Grade" g
       JOIN "User" u ON g."studentId" = u.id
       JOIN "Subject" sb ON g."subjectId" = sb.id
       JOIN "Term" t ON g."termId" = t.id
       JOIN "AcademicYear" ay ON t."academicYearId" = ay.id
       JOIN "School" s ON ay."schoolId" = s.id
       JOIN "District" d ON s."districtId" = d.id
       LEFT JOIN "GradeCategory" gc ON g."categoryId" = gc.id
       WHERE d."tenantId" = $1 AND g."termId" = $2`,
      [session.tenantId, termId!]
    );
  }
  const grades = gradesRes.rows;

  const headers = [
    "Student ID",
    "Student Email",
    "First Name",
    "Last Name",
    "Subject",
    "Subject Code",
    "Term",
    "Category",
    "Score",
    "Max Score",
    "Letter Grade",
  ];

  const rows = grades.map((g: Record<string, unknown>) => [
    g.studentId,
    g.email,
    g.firstName,
    g.lastName,
    g.subjectName,
    g.subjectCode,
    g.termName ?? "",
    g.categoryName ?? "",
    Number(g.score),
    Number(g.maxScore),
    g.letterGrade ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=grades.csv",
    },
  });
}
