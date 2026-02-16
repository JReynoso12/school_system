import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentGradesPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const { rows: grades } = await query<{
    id: string;
    termId: string;
    subjectId: string;
    score: string;
    maxScore: string;
    letterGrade: string | null;
    termName: string;
    academicYearName: string;
    subjectName: string;
    subjectCode: string;
    categoryName: string | null;
  }>(
    `SELECT g.id, g."termId", g."subjectId", g.score::text, g."maxScore"::text, g."letterGrade",
      t.name as "termName", ay.name as "academicYearName", sb.name as "subjectName", sb.code as "subjectCode",
      gc.name as "categoryName"
     FROM "Grade" g
     JOIN "Term" t ON g."termId" = t.id
     JOIN "AcademicYear" ay ON t."academicYearId" = ay.id
     JOIN "Subject" sb ON g."subjectId" = sb.id
     LEFT JOIN "GradeCategory" gc ON g."categoryId" = gc.id
     WHERE g."studentId" = $1
     ORDER BY t."startDate" DESC, sb.code ASC`,
    [session.userId]
  );

  const bySubject = grades.reduce<Record<string, { term: { name: string; academicYear: { name: string } }; subject: { name: string; code: string }; grades: typeof grades }>>(
    (acc, g) => {
      const key = `${g.termId}-${g.subjectId}`;
      if (!acc[key]) {
        acc[key] = {
          term: { name: g.termName, academicYear: { name: g.academicYearName } },
          subject: { name: g.subjectName, code: g.subjectCode },
          grades: [],
        };
      }
      acc[key].grades.push(g);
      return acc;
    },
    {}
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Grades</h1>
      <p className="text-muted-foreground mb-8">
        View grades by subject and term. Weighted categories determine final grades.
      </p>
      <div className="space-y-6">
        {Object.entries(bySubject).map(([key, { term, subject, grades: gs }]) => (
          <div
            key={key}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {subject.name} ({subject.code})
                </h3>
                <p className="text-sm text-muted-foreground">
                  {term.academicYear.name} • {term.name}
                </p>
              </div>
              <div className="text-right">
                {gs.length > 0 && (
                  <p className="font-medium">
                    {gs
                      .filter((g) => g.score != null)
                      .reduce((s, g) => s + Number(g.score), 0)}
                    {" / "}
                    {gs.reduce((s, g) => s + Number(g.maxScore), 0)}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {gs.map((g) => (
                <div
                  key={g.id}
                  className="flex justify-between text-sm py-2 border-t border-border"
                >
                  <span className="text-muted-foreground">
                    {g.categoryName ?? "Grade"}
                  </span>
                  <span>
                    {g.score} / {g.maxScore}
                    {g.letterGrade && ` (${g.letterGrade})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(bySubject).length === 0 && (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No grades yet.
          </div>
        )}
      </div>
    </div>
  );
}
