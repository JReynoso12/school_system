import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherExamsPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: exams } = await query<{
    id: string;
    title: string;
    subjectName: string;
    itemsCount: string;
    attemptsCount: string;
    timeLimit: number | null;
  }>(
    `SELECT e.id, e.title, e."timeLimit", sb.name as "subjectName",
      (SELECT COUNT(*)::int FROM "ExamItem" ei WHERE ei."examId" = e.id)::text as "itemsCount",
      (SELECT COUNT(*)::int FROM "ExamAttempt" ea WHERE ea."examId" = e.id)::text as "attemptsCount"
     FROM "Exam" e
     JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = e."subjectId" AND s."teacherId" = $1)
     ORDER BY e."createdAt" DESC`,
    [session.userId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Exams</h1>
      <Link
        href="/teacher/exams/new"
        className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium mb-6 hover:opacity-90"
      >
        Create Exam
      </Link>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Title</th>
              <th className="text-left p-4 font-medium">Subject</th>
              <th className="text-left p-4 font-medium">Questions</th>
              <th className="text-left p-4 font-medium">Attempts</th>
              <th className="text-left p-4 font-medium">Time Limit</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id} className="border-t border-border">
                <td className="p-4 font-medium">{exam.title}</td>
                <td className="p-4">{exam.subjectName}</td>
                <td className="p-4">{exam.itemsCount}</td>
                <td className="p-4">{exam.attemptsCount}</td>
                <td className="p-4">{exam.timeLimit ? `${exam.timeLimit} min` : "-"}</td>
                <td className="p-4">
                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No exams yet. Create your first exam.
          </div>
        )}
      </div>
    </div>
  );
}
