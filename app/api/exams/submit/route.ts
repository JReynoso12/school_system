import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { gradeObjectiveAnswer } from "@/lib/grading";
import type { QuestionType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { attemptId, answers } = body;

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 });
    }

    const attempt = await queryOne<{ id: string; examId: string }>(
      'SELECT id, "examId" FROM "ExamAttempt" WHERE id = $1 AND "studentId" = $2 AND status = $3',
      [attemptId, session.userId, "in_progress"]
    );

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }
    const itemsRes = await query<{
      id: string;
      questionId: string;
      points: string;
      type: string;
      correctAnswer: string | null;
      options: unknown;
    }>(
      `SELECT ei.id, ei."questionId", ei.points, q.type, q."correctAnswer", q.options
       FROM "ExamItem" ei JOIN "Question" q ON ei."questionId" = q.id
       WHERE ei."examId" = $1 ORDER BY ei."order" ASC`,
      [attempt.examId]
    );
    const items = itemsRes.rows;

    const answerMap = (answers as Record<string, string>) ?? {};
    let totalScore = 0;
    let maxScore = 0;
    const now = new Date();

    for (const item of items) {
      const q = { type: item.type, correctAnswer: item.correctAnswer, options: item.options };
      const pts = Number(item.points);
      maxScore += pts;
      const studentAnswer = answerMap[item.id] ?? "";

      if (q.type === "ESSAY") {
        await query(
          'INSERT INTO "ExamAnswer" ("attemptId", "examItemId", answer) VALUES ($1, $2, $3)',
          [attemptId, item.id, studentAnswer]
        );
        continue;
      }

      const { score } = gradeObjectiveAnswer(
        q.type as QuestionType,
        q.correctAnswer,
        q.options,
        studentAnswer
      );
      const earned = score * pts;
      totalScore += earned;
      await query(
        `INSERT INTO "ExamAnswer" ("attemptId", "examItemId", answer, score, "gradedAt", "gradedBy")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [attemptId, item.id, studentAnswer, earned, now, "system"]
      );
    }

    await query(
      `UPDATE "ExamAttempt" SET status = $1, "submittedAt" = $2, answers = $3, score = $4, "maxScore" = $5
       WHERE id = $6`,
      ["graded", now, JSON.stringify(answerMap), totalScore, maxScore, attemptId]
    );

    const examSection = await queryOne<{ termId: string | null; subjectId: string }>(
      `SELECT s."termId", e."subjectId"
       FROM "ExamSection" es
       JOIN "Section" s ON es."sectionId" = s.id
       JOIN "Exam" e ON es."examId" = e.id
       WHERE es."examId" = $1 AND EXISTS (
         SELECT 1 FROM "Enrollment" en WHERE en."sectionId" = es."sectionId" AND en."studentId" = $2
       )
       LIMIT 1`,
      [attempt.examId, session.userId]
    );

    if (examSection?.termId && examSection?.subjectId) {
      const catRes = await queryOne<{ id: string }>(
        'SELECT id FROM "GradeCategory" WHERE "subjectId" = $1 ORDER BY "order" ASC LIMIT 1',
        [examSection.subjectId]
      );
      await query(
        `INSERT INTO "Grade" ("studentId", "termId", "subjectId", "categoryId", "examAttemptId", score, "maxScore")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          session.userId,
          examSection.termId,
          examSection.subjectId,
          catRes?.id ?? null,
          attemptId,
          totalScore,
          maxScore,
        ]
      );
    }

    return NextResponse.json({ success: true, score: totalScore, maxScore });
  } catch (err) {
    console.error("Submit exam error:", err);
    return NextResponse.json(
      { error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}
