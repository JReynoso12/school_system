import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExamForm } from "./ExamForm";

export default async function NewExamPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const [subjectsRes, sectionsRes, questionsRes] = await Promise.all([
    query<{ id: string; name: string; code: string; gradeLevelId: string | null; gradeLevelName: string | null }>(
      `SELECT sb.id, sb.name, sb.code, sb."gradeLevelId", gl.name as "gradeLevelName"
       FROM "Subject" sb
       LEFT JOIN "GradeLevel" gl ON sb."gradeLevelId" = gl.id
       WHERE EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = sb.id AND s."teacherId" = $1)`,
      [session.userId]
    ),
    query<{ id: string; name: string; subjectName: string; schoolName: string }>(
      `SELECT s.id, s.name, sb.name as "subjectName", sc.name as "schoolName"
       FROM "Section" s
       JOIN "Subject" sb ON s."subjectId" = sb.id
       JOIN "School" sc ON s."schoolId" = sc.id
       WHERE s."teacherId" = $1 ORDER BY s.name`,
      [session.userId]
    ),
    query<{ id: string; content: string; type: string; subjectName: string }>(
      `SELECT q.id, q.content, q.type, sb.name as "subjectName"
       FROM "Question" q
       JOIN "Subject" sb ON q."subjectId" = sb.id
       WHERE EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = q."subjectId" AND s."teacherId" = $1)`,
      [session.userId]
    ),
  ]);

  const subjects = subjectsRes.rows.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    gradeLevel: s.gradeLevelId ? { id: s.gradeLevelId, name: s.gradeLevelName } : null,
  }));
  const sections = sectionsRes.rows.map((s) => ({
    id: s.id,
    name: s.name,
    subject: { name: s.subjectName },
  }));
  const questions = questionsRes.rows.map((q) => ({
    id: q.id,
    content: q.content,
    type: q.type,
    subject: { name: q.subjectName },
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create Exam</h1>
      <ExamForm
        subjects={subjects}
        sections={sections}
        questions={questions}
        tenantId={session.tenantId}
      />
    </div>
  );
}
