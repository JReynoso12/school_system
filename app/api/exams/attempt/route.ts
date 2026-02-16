import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
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

    const attempt = await queryOne(
      'SELECT id FROM "ExamAttempt" WHERE id = $1 AND "studentId" = $2 AND status = $3',
      [attemptId, session.userId, "in_progress"]
    );

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    await query('UPDATE "ExamAttempt" SET answers = $1 WHERE id = $2', [
      JSON.stringify(answers ?? {}),
      attemptId,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Save attempt error:", err);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
