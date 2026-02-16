import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const exam = await queryOne<{ id: string; title: string; subjectName: string; timeLimit: number | null }>(
    `SELECT e.id, e.title, e."timeLimit", sb.name as "subjectName"
     FROM "Exam" e JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE e.id = $1 AND EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = e."subjectId" AND s."teacherId" = $2)`,
    [id, session.userId]
  );

  if (!exam) notFound();

  const [itemsRes, sectionsRes, attemptsRes] = await Promise.all([
    query<{ id: string; content: string; type: string }>(
      `SELECT ei.id, q.content, q.type FROM "ExamItem" ei
       JOIN "Question" q ON ei."questionId" = q.id
       WHERE ei."examId" = $1 ORDER BY ei."order"`,
      [id]
    ),
    query<{ id: string; sectionName: string }>(
      `SELECT es.id, s.name as "sectionName" FROM "ExamSection" es
       JOIN "Section" s ON es."sectionId" = s.id WHERE es."examId" = $1`,
      [id]
    ),
    query<{ id: string; firstName: string; lastName: string; startedAt: Date; status: string; score: string | null; maxScore: string | null }>(
      `SELECT ea.id, u."firstName", u."lastName", ea."startedAt", ea.status, ea.score::text, ea."maxScore"::text
       FROM "ExamAttempt" ea JOIN "User" u ON ea."studentId" = u.id
       WHERE ea."examId" = $1 ORDER BY ea."startedAt" DESC`,
      [id]
    ),
  ]);
  const items = itemsRes.rows;
  const sections = sectionsRes.rows;
  const attempts = attemptsRes.rows;

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">{exam.subjectName}</p>
        </div>
        <Link
          href="/teacher/exams"
          className="text-primary hover:underline"
        >
          Back to Exams
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Questions</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Attempts</p>
          <p className="text-2xl font-bold">{attempts.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Time Limit</p>
          <p className="text-2xl font-bold">
            {exam.timeLimit ? `${exam.timeLimit} min` : "None"}
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-lg mb-4">Assigned Sections</h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((es) => (
              <span
                key={es.id}
                className="px-3 py-1 bg-muted rounded-lg text-sm"
              >
                {es.sectionName}
              </span>
            ))}
            {sections.length === 0 && (
              <span className="text-muted-foreground">Not assigned</span>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-4">Questions</h2>
          <ol className="list-decimal list-inside space-y-2">
            {items.map((item) => (
              <li key={item.id} className="text-sm">
                {item.content} ({item.type})
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-4">Attempts</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Student</th>
                  <th className="text-left p-4 font-medium">Started</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Score</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="p-4">
                      {a.firstName} {a.lastName}
                    </td>
                    <td className="p-4">
                      {new Date(a.startedAt).toLocaleString()}
                    </td>
                    <td className="p-4 capitalize">{a.status.replace("_", " ")}</td>
                    <td className="p-4">
                      {a.score != null && a.maxScore != null
                        ? `${a.score} / ${a.maxScore}`
                        : "-"}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/teacher/exams/${id}/attempts/${a.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {attempts.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No attempts yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
