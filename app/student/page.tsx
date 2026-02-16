import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const now = new Date();
  const { rows: availableExams } = await query<{
    id: string;
    title: string;
    subject: string;
    section: string;
    timeLimit: number | null;
  }>(
    `SELECT e.id, e.title, e."timeLimit", sb.name as subject, s.name as section
     FROM "ExamSection" es
     JOIN "Exam" e ON es."examId" = e.id
     JOIN "Section" s ON es."sectionId" = s.id
     JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE es."startAt" <= $1 AND es."endAt" >= $1
     AND EXISTS (SELECT 1 FROM "Enrollment" en WHERE en."sectionId" = es."sectionId" AND en."studentId" = $2)`,
    [now, session.userId]
  );

  const { rows: attempts } = await query<{
    id: string;
    examTitle: string;
    subjectName: string;
    startedAt: Date;
    status: string;
    score: string | null;
    maxScore: string | null;
  }>(
    `SELECT ea.id, e.title as "examTitle", sb.name as "subjectName", ea."startedAt", ea.status, ea.score::text, ea."maxScore"::text
     FROM "ExamAttempt" ea JOIN "Exam" e ON ea."examId" = e.id JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE ea."studentId" = $1 ORDER BY ea."startedAt" DESC LIMIT 5`,
    [session.userId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {session.email}
      </p>
      {availableExams.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Available Exams</h2>
          <div className="grid gap-4">
            {availableExams.map((exam) => (
              <Link
                key={exam.id}
                href={`/student/exams/${exam.id}/take`}
                className="block p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition"
              >
                <h3 className="font-semibold">{exam.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {exam.subject} • {exam.section} •{" "}
                  {exam.timeLimit ? `${exam.timeLimit} min` : "No time limit"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      <h2 className="font-semibold text-lg mb-4">Recent Exam Attempts</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Exam</th>
              <th className="text-left p-4 font-medium">Subject</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-4">{a.examTitle}</td>
                <td className="p-4">{a.subjectName}</td>
                <td className="p-4">
                  {new Date(a.startedAt).toLocaleDateString()}
                </td>
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
            No exam attempts yet.
          </div>
        )}
      </div>
    </div>
  );
}
