import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ParentGradesPage() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  const { rows: children } = await query<{ childId: string; firstName: string; lastName: string }>(
    `SELECT pc."childId", u."firstName", u."lastName"
     FROM "ParentChild" pc JOIN "User" u ON pc."childId" = u.id
     WHERE pc."parentId" = $1 AND pc.verified = true`,
    [session.userId]
  );

  if (children.length === 1) {
    redirect(`/parent/children/${children[0].childId}`);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Children&apos;s Grades</h1>
      <p className="text-muted-foreground mb-6">
        Select a child to view their grades.
      </p>
      <div className="grid gap-4">
        {children.map((child) => (
          <Link
            key={child.childId}
            href={`/parent/children/${child.childId}`}
            className="block p-4 bg-card border border-border rounded-xl hover:border-primary/50"
          >
            {child.firstName} {child.lastName}
          </Link>
        ))}
      </div>
    </div>
  );
}
