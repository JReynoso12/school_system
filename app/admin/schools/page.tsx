import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminSchoolsPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: schools } = await query<{
    id: string;
    name: string;
    districtName: string;
    sectionsCount: string;
  }>(
    `SELECT s.id, s.name, d.name as "districtName",
      (SELECT COUNT(*)::int FROM "Section" WHERE "schoolId" = s.id)::text as "sectionsCount"
     FROM "School" s JOIN "District" d ON s."districtId" = d.id
     WHERE d."tenantId" = $1 ORDER BY s.name`,
    [session.tenantId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Schools</h1>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">District</th>
              <th className="text-left p-4 font-medium">Sections</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.id} className="border-t border-border">
                <td className="p-4">{school.name}</td>
                <td className="p-4">{school.districtName}</td>
                <td className="p-4">{school.sectionsCount}</td>
                <td className="p-4">
                  <Link
                    href={`/admin/schools/${school.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schools.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No schools yet. Schools are created when you set up your district.
          </div>
        )}
      </div>
    </div>
  );
}
