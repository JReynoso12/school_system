import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherGradesPage() {
  const session = await getSession();
  if (!session || !["TEACHER", "DEPARTMENT_HEAD", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: sections } = await query<{
    id: string;
    name: string;
    subjectName: string;
    enrollmentsCount: string;
  }>(
    `SELECT s.id, s.name, sb.name as "subjectName",
      (SELECT COUNT(*)::int FROM "Enrollment" e WHERE e."sectionId" = s.id)::text as "enrollmentsCount"
     FROM "Section" s JOIN "Subject" sb ON s."subjectId" = sb.id
     WHERE s."teacherId" = $1`,
    [session.userId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Grades</h1>
      <p className="text-muted-foreground mb-6">
        View and manage grades by section. Grade computation uses weighted categories per subject.
      </p>
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{section.name}</h3>
                <p className="text-muted-foreground">{section.subjectName}</p>
              </div>
              <Link
                href={`/teacher/grades/${section.id}`}
                className="text-primary hover:underline font-medium"
              >
                Manage Grades
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {section.enrollmentsCount} student(s) enrolled
            </p>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No sections assigned. Grades are managed per section.
          </div>
        )}
      </div>
    </div>
  );
}
