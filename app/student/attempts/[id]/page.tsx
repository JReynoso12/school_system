import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const attempt = await queryOne<{
    examTitle: string;
    subjectName: string;
    score: string | null;
    maxScore: string | null;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
    showCorrectAnswers: boolean;
  }>(
    `SELECT e.title as "examTitle", sb.name as "subjectName", ea.score::text, ea."maxScore"::text,
      ea.status, ea."startedAt", ea."submittedAt", e."showCorrectAnswers"
     FROM "ExamAttempt" ea
     JOIN "Exam" e ON ea."examId" = e.id
     JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE ea.id = $1 AND ea."studentId" = $2`,
    [id, session.userId]
  );

  if (!attempt) notFound();

  const { rows: answersDetail } = await query<{ id: string; content: string; points: string; answer: string; score: string | null; feedback: string | null }>(
    `SELECT ea.id, q.content, ei.points::text, ea.answer, ea.score::text, ea.feedback
     FROM "ExamAnswer" ea
     JOIN "ExamItem" ei ON ea."examItemId" = ei.id
     JOIN "Question" q ON ei."questionId" = q.id
     WHERE ea."attemptId" = $1 ORDER BY ei."order"`,
    [id]
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/student" className="text-primary hover:underline mb-4 inline-block">
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2">{attempt.examTitle}</h1>
      <p className="text-muted-foreground mb-6">{attempt.subjectName}</p>
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Result</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-2xl font-bold">
              {attempt.score != null && attempt.maxScore != null
                ? `${attempt.score} / ${attempt.maxScore}`
                : "Pending"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="capitalize">{attempt.status.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p>{new Date(attempt.startedAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p>
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString()
                : "-"}
            </p>
          </div>
        </div>
      </div>
      {attempt.showCorrectAnswers && attempt.status === "graded" && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Review</h2>
          {answersDetail.map((ea) => (
            <div
              key={ea.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <p className="font-medium mb-2">{ea.content}</p>
              <p className="text-sm text-muted-foreground mb-1">
                Your answer: {ea.answer}
              </p>
              <p className="text-sm">
                Score: {ea.score ?? "-"} / {ea.points}
              </p>
              {ea.feedback && (
                <p className="text-sm mt-2 text-muted-foreground">
                  Feedback: {ea.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
