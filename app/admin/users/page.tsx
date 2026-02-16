import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: users } = await query<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    schoolNames: string;
  }>(
    `SELECT u.id, u."firstName", u."lastName", u.email, u.role,
      COALESCE((SELECT string_agg(s.name, ', ') FROM "UserSchoolAssignment" usa
        JOIN "School" s ON usa."schoolId" = s.id WHERE usa."userId" = u.id), '') as "schoolNames"
     FROM "User" u WHERE u."tenantId" = $1 ORDER BY u.role, u."lastName"`,
    [session.tenantId]
  );

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    SCHOOL_ADMIN: "School Admin",
    DEPARTMENT_HEAD: "Department Head",
    TEACHER: "Teacher",
    STUDENT: "Student",
    PARENT: "Parent",
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <a
          href="/admin/users/import"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition"
        >
          Import CSV
        </a>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Role</th>
              <th className="text-left p-4 font-medium">Schools</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-4">
                  {user.firstName} {user.lastName}
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{roleLabels[user.role] ?? user.role}</td>
                <td className="p-4">{user.schoolNames || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
