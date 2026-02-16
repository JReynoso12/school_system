import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function TeacherAttemptViewPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: examId, attemptId } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const attempt = await queryOne<{ examTitle: string; firstName: string; lastName: string; startedAt: Date; status: string; score: string | null; maxScore: string | null }>(
    `SELECT e.title as "examTitle", u."firstName", u."lastName", ea."startedAt", ea.status, ea.score::text, ea."maxScore"::text
     FROM "ExamAttempt" ea
     JOIN "Exam" e ON ea."examId" = e.id
     JOIN "User" u ON ea."studentId" = u.id
     WHERE ea.id = $1 AND ea."examId" = $2 AND EXISTS (
       SELECT 1 FROM "Section" s WHERE s."subjectId" = e."subjectId" AND s."teacherId" = $3
     )`,
    [attemptId, examId, session.userId]
  );

  if (!attempt) notFound();

  const { rows: answersDetail } = await query<{ id: string; content: string; type: string; points: string; answer: string; score: string | null; feedback: string | null }>(
    `SELECT ea.id, q.content, q.type, ei.points::text, ea.answer, ea.score::text, ea.feedback
     FROM "ExamAnswer" ea
     JOIN "ExamItem" ei ON ea."examItemId" = ei.id
     JOIN "Question" q ON ei."questionId" = q.id
     WHERE ea."attemptId" = $1 ORDER BY ei."order"`,
    [attemptId]
  );

  return (
    <div className="p-8">
      <Link href={`/teacher/exams/${examId}`} className="text-primary hover:underline mb-4 inline-block">
        Back to Exam
      </Link>
      <h1 className="text-2xl font-bold mb-2">{attempt.examTitle}</h1>
      <p className="text-muted-foreground mb-6">
        {attempt.firstName} {attempt.lastName} •{" "}
        {new Date(attempt.startedAt).toLocaleString()} •{" "}
        {attempt.score != null && attempt.maxScore != null
          ? `${attempt.score} / ${attempt.maxScore}`
          : attempt.status}
      </p>
      <div className="space-y-6">
        {answersDetail.map((ea) => (
          <div
            key={ea.id}
            className="bg-card border border-border rounded-xl p-6"
          >
            <p className="font-medium mb-2">{ea.content}</p>
            <p className="text-sm text-muted-foreground mb-2">
              Type: {ea.type} • Points: {ea.points}
            </p>
            <p className="mb-2">
              <strong>Answer:</strong> {ea.answer || "(blank)"}
            </p>
            <p className="text-sm">
              Score: {ea.score ?? "Pending"} / {ea.points}
            </p>
            {ea.feedback && (
              <p className="text-sm mt-2 text-muted-foreground">Feedback: {ea.feedback}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
