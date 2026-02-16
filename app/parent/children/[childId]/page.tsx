import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  const child = await queryOne<{ firstName: string; lastName: string; email: string }>(
    `SELECT u."firstName", u."lastName", u.email
     FROM "ParentChild" pc JOIN "User" u ON pc."childId" = u.id
     WHERE pc."parentId" = $1 AND pc."childId" = $2 AND pc.verified = true`,
    [session.userId, childId]
  );

  if (!child) notFound();

  const [gradesRes, attemptsRes] = await Promise.all([
    query<{ id: string; subjectName: string; termName: string; academicYearName: string; categoryName: string | null; score: string; maxScore: string }>(
      `SELECT g.id, sb.name as "subjectName", t.name as "termName", ay.name as "academicYearName",
        gc.name as "categoryName", g.score::text, g."maxScore"::text
       FROM "Grade" g
       JOIN "Term" t ON g."termId" = t.id
       JOIN "AcademicYear" ay ON t."academicYearId" = ay.id
       JOIN "Subject" sb ON g."subjectId" = sb.id
       LEFT JOIN "GradeCategory" gc ON g."categoryId" = gc.id
       WHERE g."studentId" = $1 ORDER BY t."startDate" DESC, sb.code ASC LIMIT 10`,
      [childId]
    ),
    query<{ id: string; examTitle: string; subjectName: string; submittedAt: Date | null; score: string | null; maxScore: string | null }>(
      `SELECT ea.id, e.title as "examTitle", sb.name as "subjectName", ea."submittedAt", ea.score::text, ea."maxScore"::text
       FROM "ExamAttempt" ea JOIN "Exam" e ON ea."examId" = e.id JOIN "Subject" sb ON e."subjectId" = sb.id
       WHERE ea."studentId" = $1 AND ea.status = 'graded' ORDER BY ea."submittedAt" DESC NULLS LAST LIMIT 10`,
      [childId]
    ),
  ]);
  const grades = gradesRes.rows;
  const attempts = attemptsRes.rows;

  return (
    <div className="p-8">
      <Link href="/parent" className="text-primary hover:underline mb-4 inline-block">
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        {child.firstName} {child.lastName}
      </h1>
      <p className="text-muted-foreground mb-8">{child.email}</p>
      <div className="space-y-8">
        <div>
          <h2 className="font-semibold text-lg mb-4">Recent Grades</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Subject</th>
                  <th className="text-left p-4 font-medium">Term</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id} className="border-t border-border">
                    <td className="p-4">{g.subjectName}</td>
                    <td className="p-4">
                      {g.academicYearName} • {g.termName}
                    </td>
                    <td className="p-4">{g.categoryName ?? "-"}</td>
                    <td className="p-4">
                      {g.score} / {g.maxScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {grades.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No grades yet.
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-4">Recent Exam Results</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Exam</th>
                  <th className="text-left p-4 font-medium">Subject</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="p-4">{a.examTitle}</td>
                    <td className="p-4">{a.subjectName}</td>
                    <td className="p-4">
                      {a.submittedAt
                        ? new Date(a.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-4">
                      {a.score != null && a.maxScore != null
                        ? `${a.score} / ${a.maxScore}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attempts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No exam results yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
