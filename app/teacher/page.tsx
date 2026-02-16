import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: sections } = await query<{
    id: string;
    name: string;
    subjectName: string;
    schoolName: string;
    enrollmentsCount: string;
    examsCount: string;
  }>(
    `SELECT s.id, s.name, sb.name as "subjectName", sc.name as "schoolName",
      (SELECT COUNT(*)::int FROM "Enrollment" e WHERE e."sectionId" = s.id)::text as "enrollmentsCount",
      (SELECT COUNT(*)::int FROM "ExamSection" es WHERE es."sectionId" = s.id)::text as "examsCount"
     FROM "Section" s
     JOIN "Subject" sb ON s."subjectId" = sb.id
     JOIN "School" sc ON s."schoolId" = sc.id
     WHERE s."teacherId" = $1`,
    [session.userId]
  );

  const examsCountRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int::text as count FROM "Exam" e
     WHERE EXISTS (SELECT 1 FROM "Section" s WHERE s."subjectId" = e."subjectId" AND s."teacherId" = $1)`,
    [session.userId]
  );
  const examsCount = Number(examsCountRes.rows[0]?.count ?? 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {session.email}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/teacher/sections">
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition">
            <h3 className="font-semibold text-lg mb-2">My Sections</h3>
            <p className="text-3xl font-bold text-primary">{sections.length}</p>
          </div>
        </Link>
        <Link href="/teacher/exams">
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition">
            <h3 className="font-semibold text-lg mb-2">Exams</h3>
            <p className="text-3xl font-bold text-primary">{examsCount}</p>
          </div>
        </Link>
      </div>
      <h2 className="font-semibold text-lg mb-4">My Sections</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Section</th>
              <th className="text-left p-4 font-medium">Subject</th>
              <th className="text-left p-4 font-medium">School</th>
              <th className="text-left p-4 font-medium">Students</th>
              <th className="text-left p-4 font-medium">Exams</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id} className="border-t border-border">
                <td className="p-4">{section.name}</td>
                <td className="p-4">{section.subjectName}</td>
                <td className="p-4">{section.schoolName}</td>
                <td className="p-4">{section.enrollmentsCount}</td>
                <td className="p-4">{section.examsCount}</td>
                <td className="p-4">
                  <Link
                    href={`/teacher/sections/${section.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sections.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No sections assigned yet.
          </div>
        )}
      </div>
    </div>
  );
}
