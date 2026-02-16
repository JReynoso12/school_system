import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";

interface AcademicYearRow {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  schoolName: string;
}

interface TermRow {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export default async function AdminAcademicYearsPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const ayRes = await query<AcademicYearRow>(
    `SELECT ay.id, ay.name, ay."startDate", ay."endDate", s.name as "schoolName"
     FROM "AcademicYear" ay
     JOIN "School" s ON ay."schoolId" = s.id
     JOIN "District" d ON s."districtId" = d.id
     WHERE d."tenantId" = $1
     ORDER BY ay."startDate" DESC`,
    [session.tenantId]
  );

  const termsByAy: Record<string, TermRow[]> = {};
  for (const ay of ayRes.rows) {
    const termsRes = await query<TermRow>(
      'SELECT id, name, "startDate", "endDate" FROM "Term" WHERE "academicYearId" = $1 ORDER BY "startDate" ASC',
      [ay.id]
    );
    termsByAy[ay.id] = termsRes.rows;
  }

  const academicYears = ayRes.rows.map((ay) => ({
    ...ay,
    school: { name: ay.schoolName },
    terms: termsByAy[ay.id] ?? [],
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Academic Years</h1>
      <div className="space-y-6">
        {academicYears.map((ay: (typeof academicYears)[number]) => (
          <div
            key={ay.id}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{ay.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {ay.school.name} •{" "}
                  {format(ay.startDate, "MMM d, yyyy")} –{" "}
                  {format(ay.endDate, "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Terms:
              </p>
              <ul className="flex flex-wrap gap-2">
                {ay.terms.map((term: (typeof ay.terms)[number]) => (
                  <li
                    key={term.id}
                    className="px-3 py-1 bg-muted rounded-lg text-sm"
                  >
                    {term.name} (
                    {format(term.startDate, "MMM d")} –{" "}
                    {format(term.endDate, "MMM d")})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {academicYears.length === 0 && (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No academic years configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
