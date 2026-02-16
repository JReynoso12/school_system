import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function AdminAuditLogsPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const { rows: logs } = await query<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: Date;
    firstName: string | null;
    lastName: string | null;
  }>(
    `SELECT al.id, al.action, al.entity, al."entityId", al."createdAt", u."firstName", u."lastName"
     FROM "AuditLog" al LEFT JOIN "User" u ON al."userId" = u.id
     WHERE al."tenantId" = $1 ORDER BY al."createdAt" DESC LIMIT 100`,
    [session.tenantId]
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Immutable log of system actions for compliance and audit.
          </p>
        </div>
        <a
          href="/api/export/audit-logs"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          Export CSV
        </a>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Time</th>
              <th className="text-left p-4 font-medium">User</th>
              <th className="text-left p-4 font-medium">Action</th>
              <th className="text-left p-4 font-medium">Entity</th>
              <th className="text-left p-4 font-medium">Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="p-4 text-sm">
                  {format(log.createdAt, "MMM d, yyyy HH:mm:ss")}
                </td>
                <td className="p-4">
                  {log.firstName && log.lastName
                    ? `${log.firstName} ${log.lastName}`
                    : "System"}
                </td>
                <td className="p-4">{log.action}</td>
                <td className="p-4">{log.entity}</td>
                <td className="p-4 font-mono text-sm">{log.entityId ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No audit logs yet.
          </div>
        )}
      </div>
    </div>
  );
}
