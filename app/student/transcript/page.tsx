import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudentTranscriptPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const { rows: grades } = await query<{
    termId: string;
    termName: string;
    academicYearName: string;
    subjectName: string;
    subjectCode: string;
    creditHours: string | null;
    score: string;
    maxScore: string;
    letterGrade: string | null;
  }>(
    `SELECT g."termId", t.name as "termName", ay.name as "academicYearName",
      sb.name as "subjectName", sb.code as "subjectCode", sb."creditHours"::text,
      g.score::text, g."maxScore"::text, g."letterGrade"
     FROM "Grade" g
     JOIN "Term" t ON g."termId" = t.id
     JOIN "AcademicYear" ay ON t."academicYearId" = ay.id
     JOIN "Subject" sb ON g."subjectId" = sb.id
     WHERE g."studentId" = $1
     ORDER BY t."startDate" DESC, sb.code ASC`,
    [session.userId]
  );

  const byTerm = grades.reduce<Record<string, { term: { name: string; academicYear: { name: string } }; subjects: Array<{ subject: { name: string; code: string; creditHours: string | null }; score: string; maxScore: string; letterGrade: string | null }> }>>(
    (acc, g) => {
      const key = g.termId;
      if (!acc[key]) {
        acc[key] = {
          term: { name: g.termName, academicYear: { name: g.academicYearName } },
          subjects: [],
        };
      }
      acc[key].subjects.push({
        subject: { name: g.subjectName, code: g.subjectCode, creditHours: g.creditHours },
        score: g.score,
        maxScore: g.maxScore,
        letterGrade: g.letterGrade,
      });
      return acc;
    },
    {}
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transcript</h1>
      <p className="text-muted-foreground mb-8">
        Read-only academic record. Printable.
      </p>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold text-lg">Academic Record</h2>
          <p className="text-sm text-muted-foreground">
            Unofficial transcript preview
          </p>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(byTerm).map(([key, { term, subjects }]) => (
            <div key={key} className="p-6">
              <h3 className="font-medium mb-4">
                {term.academicYear.name} • {term.name}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Subject</th>
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Credits</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2">{s.subject.name}</td>
                      <td className="py-2 font-mono">{s.subject.code}</td>
                      <td className="py-2">
                        {s.subject.creditHours != null
                          ? s.subject.creditHours
                          : "-"}
                      </td>
                      <td className="py-2">
                        {s.score} / {s.maxScore}
                      </td>
                      <td className="py-2">{s.letterGrade ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        {Object.keys(byTerm).length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No transcript data yet.
          </div>
        )}
      </div>
    </div>
  );
}
