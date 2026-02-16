import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function SectionGradesPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const section = await queryOne<{ sectionName: string; subjectId: string; subjectName: string; termId: string | null; termName: string | null; enrollmentsCount: string }>(
    `SELECT s.name as "sectionName", s."subjectId", sb.name as "subjectName", s."termId", t.name as "termName",
      (SELECT COUNT(*)::int FROM "Enrollment" e WHERE e."sectionId" = s.id)::text as "enrollmentsCount"
     FROM "Section" s
     JOIN "Subject" sb ON s."subjectId" = sb.id
     LEFT JOIN "Term" t ON s."termId" = t.id
     WHERE s.id = $1 AND s."teacherId" = $2`,
    [sectionId, session.userId]
  );

  if (!section) notFound();

  const termId = section.termId;
  let grades: Array<{ id: string; firstName: string; lastName: string; categoryName: string | null; score: string; maxScore: string }> = [];
  if (termId) {
    const gradesRes = await query<{ id: string; firstName: string; lastName: string; categoryName: string | null; score: string; maxScore: string }>(
      `SELECT g.id, u."firstName", u."lastName", gc.name as "categoryName", g.score::text, g."maxScore"::text
       FROM "Grade" g
       JOIN "User" u ON g."studentId" = u.id
       LEFT JOIN "GradeCategory" gc ON g."categoryId" = gc.id
       WHERE g."subjectId" = $1 AND g."termId" = $2 AND g."studentId" IN (
         SELECT "studentId" FROM "Enrollment" WHERE "sectionId" = $3
       )`,
      [section.subjectId, termId, sectionId]
    );
    grades = gradesRes.rows;
  }

  return (
    <div className="p-8">
      <Link href="/teacher/grades" className="text-primary hover:underline mb-4 inline-block">
        Back to Grades
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        Grades: {section.sectionName} ({section.subjectName})
      </h1>
      <p className="text-muted-foreground mb-6">
        {section.termName ?? "No term"} • {section.enrollmentsCount} students
      </p>
      <a
        href={`/api/export/grades?sectionId=${sectionId}${termId ? `&termId=${termId}` : ""}`}
        className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium mb-6 hover:opacity-90"
      >
        Export CSV
      </a>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Student</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Max</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <td className="p-4">
                  {g.firstName} {g.lastName}
                </td>
                <td className="p-4">{g.categoryName ?? "-"}</td>
                <td className="p-4">{g.score}</td>
                <td className="p-4">{g.maxScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {grades.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No grades recorded yet. Grades are created when exams are submitted and
            linked to grade categories.
          </div>
        )}
      </div>
    </div>
  );
}
