import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const section = await queryOne<{ name: string; subjectName: string; gradeLevelName: string; schoolName: string }>(
    `SELECT s.name, sb.name as "subjectName", gl.name as "gradeLevelName", sc.name as "schoolName"
     FROM "Section" s
     JOIN "Subject" sb ON s."subjectId" = sb.id
     JOIN "GradeLevel" gl ON s."gradeLevelId" = gl.id
     JOIN "School" sc ON s."schoolId" = sc.id
     WHERE s.id = $1 AND s."teacherId" = $2`,
    [id, session.userId]
  );

  if (!section) notFound();

  const [enrollmentsRes, examsRes] = await Promise.all([
    query<{ id: string; firstName: string; lastName: string; email: string }>(
      `SELECT e.id, u."firstName", u."lastName", u.email
       FROM "Enrollment" e JOIN "User" u ON e."studentId" = u.id
       WHERE e."sectionId" = $1`,
      [id]
    ),
    query<{ id: string; examId: string; examTitle: string; startAt: Date; endAt: Date }>(
      `SELECT es.id, es."examId", e.title as "examTitle", es."startAt", es."endAt"
       FROM "ExamSection" es JOIN "Exam" e ON es."examId" = e.id
       WHERE es."sectionId" = $1`,
      [id]
    ),
  ]);
  const enrollments = enrollmentsRes.rows;
  const exams = examsRes.rows;

  return (
    <div className="p-8">
      <Link href="/teacher/sections" className="text-primary hover:underline mb-4 inline-block">
        Back to Sections
      </Link>
      <h1 className="text-2xl font-bold mb-2">{section.name}</h1>
      <p className="text-muted-foreground mb-6">
        {section.subjectName} • {section.gradeLevelName} • {section.schoolName}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-semibold text-lg mb-4">Enrolled Students</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-4">
                      {e.firstName} {e.lastName}
                    </td>
                    <td className="p-4">{e.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enrollments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No students enrolled.
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-4">Assigned Exams</h2>
          <div className="space-y-2">
            {exams.map((es) => (
              <Link
                key={es.id}
                href={`/teacher/exams/${es.examId}`}
                className="block p-4 bg-card border border-border rounded-xl hover:border-primary/50"
              >
                <p className="font-medium">{es.examTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(es.startAt).toLocaleDateString()} –{" "}
                  {new Date(es.endAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
            {exams.length === 0 && (
              <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
                No exams assigned.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
