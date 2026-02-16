import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ExamHistoryPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const { rows: attempts } = await query<{
    id: string;
    startedAt: Date;
    status: string;
    score: string | null;
    maxScore: string | null;
  }>(
    'SELECT id, "startedAt", status, score::text, "maxScore"::text FROM "ExamAttempt" WHERE "examId" = $1 AND "studentId" = $2 ORDER BY "startedAt" DESC',
    [examId, session.userId]
  );

  const examRes = await queryOne<{ title: string; subjectName: string }>(
    `SELECT e.title, sb.name as "subjectName" FROM "Exam" e
     JOIN "Subject" sb ON e."subjectId" = sb.id WHERE e.id = $1`,
    [examId]
  );

  if (attempts.length === 0) {
    const checkExam = await queryOne(
      `SELECT 1 FROM "Exam" e
       WHERE e.id = $1 AND EXISTS (
         SELECT 1 FROM "ExamSection" es
         JOIN "Enrollment" en ON en."sectionId" = es."sectionId"
         WHERE es."examId" = e.id AND en."studentId" = $2
       )`,
      [examId, session.userId]
    );
    if (!checkExam) notFound();
  }

  const exam = examRes;

  return (
    <div className="p-8">
      <Link href="/student/exams" className="text-primary hover:underline mb-4 inline-block">
        Back to Exams
      </Link>
      <h1 className="text-2xl font-bold mb-2">
        {exam?.title ?? "Exam History"}
      </h1>
      <p className="text-muted-foreground mb-6">
        {exam?.subjectName}
      </p>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Attempt</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-4">Attempt {attempts.length - i}</td>
                <td className="p-4">{new Date(a.startedAt).toLocaleString()}</td>
                <td className="p-4 capitalize">{a.status.replace("_", " ")}</td>
                <td className="p-4">
                  {a.score != null && a.maxScore != null
                    ? `${a.score} / ${a.maxScore}`
                    : "-"}
                </td>
                <td className="p-4">
                  <Link
                    href={`/student/attempts/${a.id}`}
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
            No attempts for this exam yet.
          </div>
        )}
      </div>
    </div>
  );
}
