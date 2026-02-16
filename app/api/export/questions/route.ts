import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const { rows: questions } = await query<{
    id: string;
    type: string;
    content: string;
    correctAnswer: string | null;
    points: string;
    tags: string[];
    options: unknown;
  }>(
    subjectId
      ? `SELECT q.id, q.type, q.content, q."correctAnswer", q.points, q.tags, q.options, sb.name as "subjectName"
         FROM "Question" q JOIN "Subject" sb ON q."subjectId" = sb.id
         WHERE q."subjectId" = $1 AND EXISTS (
           SELECT 1 FROM "Section" s WHERE s."subjectId" = q."subjectId" AND s."teacherId" = $2
         )`
      : `SELECT q.id, q.type, q.content, q."correctAnswer", q.points, q.tags, q.options, sb.name as "subjectName"
         FROM "Question" q JOIN "Subject" sb ON q."subjectId" = sb.id
         WHERE EXISTS (
           SELECT 1 FROM "Section" s WHERE s."subjectId" = q."subjectId" AND s."teacherId" = $1
         )`,
    subjectId ? [subjectId, session.userId] : [session.userId]
  );

  const headers = [
    "ID",
    "Subject",
    "Type",
    "Content",
    "Correct Answer",
    "Points",
    "Tags",
    "Options",
  ];

  const rows = questions.map((q: { id: string; subjectName?: string; type: string; content: string; correctAnswer: string | null; points: string; tags: string[]; options: unknown }) => [
    q.id,
    q.subjectName ?? "",
    q.type,
    q.content.replace(/"/g, '""'),
    (q.correctAnswer ?? "").replace(/"/g, '""'),
    Number(q.points),
    q.tags.join(";"),
    JSON.stringify(q.options ?? {}).replace(/"/g, '""'),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=question-bank.csv",
    },
  });
}
