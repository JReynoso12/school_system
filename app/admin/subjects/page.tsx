import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminSubjectsPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: subjects } = await query<{
    id: string;
    code: string;
    name: string;
    schoolName: string;
    gradeLevelName: string | null;
    examsCount: string;
    questionsCount: string;
  }>(
    `SELECT sb.id, sb.code, sb.name, s.name as "schoolName", gl.name as "gradeLevelName",
      (SELECT COUNT(*)::int FROM "Exam" WHERE "subjectId" = sb.id)::text as "examsCount",
      (SELECT COUNT(*)::int FROM "Question" WHERE "subjectId" = sb.id)::text as "questionsCount"
     FROM "Subject" sb JOIN "School" s ON sb."schoolId" = s.id
     JOIN "District" d ON s."districtId" = d.id
     LEFT JOIN "GradeLevel" gl ON sb."gradeLevelId" = gl.id
     WHERE d."tenantId" = $1 ORDER BY sb.code`,
    [session.tenantId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Subjects</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Code</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">School</th>
              <th className="text-left p-4 font-medium">Grade Level</th>
              <th className="text-left p-4 font-medium">Exams</th>
              <th className="text-left p-4 font-medium">Questions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id} className="border-t border-border">
                <td className="p-4 font-mono">{subject.code}</td>
                <td className="p-4">{subject.name}</td>
                <td className="p-4">{subject.schoolName}</td>
                <td className="p-4">{subject.gradeLevelName ?? "-"}</td>
                <td className="p-4">{subject.examsCount}</td>
                <td className="p-4">{subject.questionsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {subjects.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No subjects yet.
          </div>
        )}
      </div>
    </div>
  );
}
