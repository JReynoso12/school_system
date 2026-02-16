import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherSectionsPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: sections } = await query<{
    id: string;
    name: string;
    subjectName: string;
    gradeLevelName: string;
    schoolName: string;
    enrollmentsCount: string;
    examsCount: string;
  }>(
    `SELECT s.id, s.name, sb.name as "subjectName", gl.name as "gradeLevelName", sc.name as "schoolName",
      (SELECT COUNT(*)::int FROM "Enrollment" e WHERE e."sectionId" = s.id)::text as "enrollmentsCount",
      (SELECT COUNT(*)::int FROM "ExamSection" es WHERE es."sectionId" = s.id)::text as "examsCount"
     FROM "Section" s
     JOIN "Subject" sb ON s."subjectId" = sb.id
     JOIN "GradeLevel" gl ON s."gradeLevelId" = gl.id
     JOIN "School" sc ON s."schoolId" = sc.id
     WHERE s."teacherId" = $1`,
    [session.userId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Sections</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Section</th>
              <th className="text-left p-4 font-medium">Subject</th>
              <th className="text-left p-4 font-medium">Grade Level</th>
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
                <td className="p-4">{section.gradeLevelName}</td>
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
