import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      subjectId,
      sectionIds,
      timeLimit,
      shuffleQuestions,
      shuffleOptions,
      questionIds,
      tenantId,
    } = body;

    if (!title || !subjectId || !questionIds?.length || !tenantId) {
      return NextResponse.json(
        { error: "Title, subject, and at least one question are required" },
        { status: 400 }
      );
    }

    const examRes = await query<{ id: string }>(
      `INSERT INTO "Exam" (title, description, "subjectId", "tenantId", "timeLimit", "shuffleQuestions", "shuffleOptions")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        title,
        description || null,
        subjectId,
        tenantId,
        timeLimit ?? null,
        shuffleQuestions ?? true,
        shuffleOptions ?? true,
      ]
    );
    const examId = examRes.rows[0].id;

    for (let i = 0; i < questionIds.length; i++) {
      await query(
        'INSERT INTO "ExamItem" ("examId", "questionId", "order", points) VALUES ($1, $2, $3, 1)',
        [examId, questionIds[i], i]
      );
    }

    if (sectionIds?.length) {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      for (const sectionId of sectionIds) {
        await query(
          `INSERT INTO "ExamSection" ("examId", "sectionId", "startAt", "endAt")
           VALUES ($1, $2, $3, $4) ON CONFLICT ("examId", "sectionId") DO NOTHING`,
          [examId, sectionId, now, endDate]
        );
      }
    }

    for (const qId of questionIds) {
      await query('UPDATE "Question" SET "usageCount" = "usageCount" + 1 WHERE id = $1', [qId]);
    }

    return NextResponse.json({ id: examId });
  } catch (err) {
    console.error("Create exam error:", err);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 }
    );
  }
}
