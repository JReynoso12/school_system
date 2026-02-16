import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImportForm } from "./ImportForm";

export default async function ImportUsersPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: schools } = await query<{ id: string; name: string }>(
    'SELECT s.id, s.name FROM "School" s JOIN "District" d ON s."districtId" = d.id WHERE d."tenantId" = $1 ORDER BY s.name',
    [session.tenantId]
  );

  return (
    <div className="p-8">
      <a href="/admin/users" className="text-primary hover:underline mb-4 inline-block">
        Back to Users
      </a>
      <ImportForm schools={schools} />
    </div>
  );
}
