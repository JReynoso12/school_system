import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentExamsPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    redirect("/login");
  }

  const now = new Date();
  const { rows: allExams } = await query<{
    id: string;
    title: string;
    subject: string;
    section: string;
    timeLimit: number | null;
    startAt: Date;
    endAt: Date;
  }>(
    `SELECT e.id, e.title, e."timeLimit", sb.name as subject, s.name as section, es."startAt", es."endAt"
     FROM "ExamSection" es
     JOIN "Exam" e ON es."examId" = e.id
     JOIN "Section" s ON es."sectionId" = s.id
     JOIN "Subject" sb ON e."subjectId" = sb.id
     WHERE EXISTS (SELECT 1 FROM "Enrollment" en WHERE en."sectionId" = es."sectionId" AND en."studentId" = $1)`,
    [session.userId]
  );
  const available = allExams.filter(
    (e) => new Date(e.startAt) <= now && new Date(e.endAt) >= now
  );
  const upcoming = allExams.filter((e) => new Date(e.startAt) > now);
  const past = allExams.filter((e) => new Date(e.endAt) < now);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Exams</h1>
      {available.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Available Now</h2>
          <div className="grid gap-4">
            {available.map((exam) => (
              <Link
                key={exam.id}
                href={`/student/exams/${exam.id}/take`}
                className="block p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition"
              >
                <h3 className="font-semibold">{exam.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {exam.subject} • {exam.section} •{" "}
                  {exam.timeLimit ? `${exam.timeLimit} min` : "No time limit"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Due: {new Date(exam.endAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Upcoming</h2>
          <div className="grid gap-4">
            {upcoming.map((exam) => (
              <div
                key={exam.id}
                className="p-6 bg-card border border-border rounded-xl opacity-75"
              >
                <h3 className="font-semibold">{exam.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {exam.subject} • {exam.section} • Opens{" "}
                  {new Date(exam.startAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-4">Past Exams</h2>
          <div className="grid gap-4">
            {past.map((exam) => (
              <Link
                key={exam.id}
                href={`/student/exams/history/${exam.id}`}
                className="block p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition"
              >
                <h3 className="font-semibold">{exam.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {exam.subject} • {exam.section}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
      {allExams.length === 0 && (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
          No exams assigned.
        </div>
      )}
    </div>
  );
}
