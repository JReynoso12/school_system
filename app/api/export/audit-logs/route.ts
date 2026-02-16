import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "1000", 10), 5000);

  const { rows: logs } = await query<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    ipAddress: string | null;
    createdAt: Date;
    firstName: string | null;
    lastName: string | null;
  }>(
    `SELECT al.id, al.action, al.entity, al."entityId", al."ipAddress", al."createdAt", u."firstName", u."lastName"
     FROM "AuditLog" al LEFT JOIN "User" u ON al."userId" = u.id
     WHERE al."tenantId" = $1 ORDER BY al."createdAt" DESC LIMIT $2`,
    [session.tenantId, limit]
  );

  const headers = [
    "ID",
    "Created At",
    "User",
    "Action",
    "Entity",
    "Entity ID",
    "IP Address",
  ];

  const rows = logs.map((l) => [
    l.id,
    l.createdAt.toISOString(),
    l.firstName && l.lastName ? `${l.firstName} ${l.lastName}` : "",
    l.action,
    l.entity,
    l.entityId ?? "",
    l.ipAddress ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=audit-logs.csv",
    },
  });
}
