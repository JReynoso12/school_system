import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TeacherQuestionBankPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: questions } = await query<{
    id: string;
    content: string;
    type: string;
    subjectName: string;
    tags: string[];
    points: string;
    usageCount: number;
  }>(
    `SELECT q.id, q.content, q.type, q.tags, q.points::text, q."usageCount", sb.name as "subjectName"
     FROM "Question" q JOIN "Subject" sb ON q."subjectId" = sb.id
     WHERE EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = q."subjectId" AND s."teacherId" = $1)
     ORDER BY q."createdAt" DESC`,
    [session.userId]
  );

  const typeLabels: Record<string, string> = {
    MULTIPLE_CHOICE: "Multiple Choice",
    TRUE_FALSE: "True/False",
    IDENTIFICATION: "Identification",
    SHORT_ANSWER: "Short Answer",
    ESSAY: "Essay",
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground mt-1">
            Browse and reuse questions across exams. Tag with subject, topic, difficulty.
          </p>
        </div>
        <a
          href="/api/export/questions"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          Export CSV
        </a>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Content</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium">Subject</th>
              <th className="text-left p-4 font-medium">Tags</th>
              <th className="text-left p-4 font-medium">Points</th>
              <th className="text-left p-4 font-medium">Usage</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t border-border">
                <td className="p-4 max-w-md truncate">{q.content}</td>
                <td className="p-4">{typeLabels[q.type] ?? q.type}</td>
                <td className="p-4">{q.subjectName}</td>
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {(Array.isArray(q.tags) ? q.tags : []).join(", ") || "-"}
                  </span>
                </td>
                <td className="p-4">{Number(q.points)}</td>
                <td className="p-4">{q.usageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {questions.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No questions in the bank yet. Add questions when creating exams.
          </div>
        )}
      </div>
    </div>
  );
}
