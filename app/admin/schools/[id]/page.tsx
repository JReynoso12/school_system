import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const school = await queryOne<{ id: string; name: string; districtName: string; sectionsCount: string }>(
    `SELECT s.id, s.name, d.name as "districtName",
      (SELECT COUNT(*)::int FROM "Section" WHERE "schoolId" = s.id)::text as "sectionsCount"
     FROM "School" s JOIN "District" d ON s."districtId" = d.id
     WHERE s.id = $1 AND d."tenantId" = $2`,
    [id, session.tenantId]
  );

  if (!school) notFound();

  const { rows: gradeLevels } = await query<{ id: string; name: string }>(
    'SELECT id, name FROM "GradeLevel" WHERE "schoolId" = $1 ORDER BY level',
    [id]
  );

  const { rows: academicYears } = await query<{ id: string; name: string; startDate: Date; endDate: Date }>(
    'SELECT id, name, "startDate", "endDate" FROM "AcademicYear" WHERE "schoolId" = $1 ORDER BY "startDate" DESC',
    [id]
  );

  const termsByAy: Record<string, { id: string; name: string }[]> = {};
  for (const ay of academicYears) {
    const { rows: terms } = await query<{ id: string; name: string }>(
      'SELECT id, name FROM "Term" WHERE "academicYearId" = $1 ORDER BY "startDate"',
      [ay.id]
    );
    termsByAy[ay.id] = terms;
  }

  return (
    <div className="p-8">
      <Link href="/admin/schools" className="text-primary hover:underline mb-4 inline-block">
        Back to Schools
      </Link>
      <h1 className="text-2xl font-bold mb-2">{school.name}</h1>
      <p className="text-muted-foreground mb-6">
        {school.districtName} • {school.sectionsCount} sections
      </p>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-lg mb-4">Grade Levels</h2>
          <div className="flex flex-wrap gap-2">
            {gradeLevels.map((gl) => (
              <span
                key={gl.id}
                className="px-3 py-1 bg-muted rounded-lg text-sm"
              >
                {gl.name}
              </span>
            ))}
            {gradeLevels.length === 0 && (
              <span className="text-muted-foreground">None</span>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-4">Academic Years</h2>
          <div className="space-y-4">
            {academicYears.map((ay) => (
              <div
                key={ay.id}
                className="p-4 bg-card border border-border rounded-xl"
              >
                <h3 className="font-medium">{ay.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {ay.startDate.toLocaleDateString()} – {ay.endDate.toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(termsByAy[ay.id] ?? []).map((t) => (
                    <span
                      key={t.id}
                      className="text-sm px-2 py-1 bg-muted rounded"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {academicYears.length === 0 && (
              <p className="text-muted-foreground">No academic years</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
