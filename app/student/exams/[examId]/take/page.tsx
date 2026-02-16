import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ExamTaker } from "./ExamTaker";

export default async function TakeExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const exam = await queryOne<{ id: string; title: string; timeLimit: number | null; shuffleQuestions: boolean; shuffleOptions: boolean }>(
    `SELECT e.id, e.title, e."timeLimit", e."shuffleQuestions", e."shuffleOptions"
     FROM "Exam" e
     WHERE e.id = $1 AND EXISTS (
       SELECT 1 FROM "ExamSection" es
       JOIN "Enrollment" en ON en."sectionId" = es."sectionId"
       WHERE es."examId" = e.id AND en."studentId" = $2
       AND es."startAt" <= $3 AND es."endAt" >= $3
     )`,
    [examId, session.userId, new Date()]
  );

  if (!exam) notFound();

  let attempt = await queryOne<{ id: string }>(
    'SELECT id FROM "ExamAttempt" WHERE "examId" = $1 AND "studentId" = $2 AND status = $3',
    [examId, session.userId, "in_progress"]
  );

  if (!attempt) {
    const insertRes = await query<{ id: string }>(
      'INSERT INTO "ExamAttempt" ("examId", "studentId", status) VALUES ($1, $2, $3) RETURNING id',
      [examId, session.userId, "in_progress"]
    );
    attempt = insertRes.rows[0];
  }

  const itemsRes = await query<{ id: string; questionId: string; type: string; content: string; options: unknown; points: string }>(
    `SELECT ei.id, q.id as "questionId", q.type, q.content, q.options, ei.points::text
     FROM "ExamItem" ei JOIN "Question" q ON ei."questionId" = q.id
     WHERE ei."examId" = $1 ORDER BY ei."order"`,
    [examId]
  );
  let items = itemsRes.rows;
  if (exam.shuffleQuestions) {
    items = [...items].sort(() => Math.random() - 0.5);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <ExamTaker
        exam={{
          id: exam.id,
          title: exam.title,
          timeLimit: exam.timeLimit,
          shuffleOptions: exam.shuffleOptions,
        }}
        items={items.map((i) => ({
          id: i.id,
          questionId: i.questionId,
          type: i.type,
          content: i.content,
          options: i.options as { id: string; text: string; correct?: boolean }[] | null,
          points: Number(i.points),
        }))}
        attemptId={attempt.id}
      />
    </div>
  );
}
