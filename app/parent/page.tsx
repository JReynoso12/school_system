import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ParentDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  const { rows: children } = await query<{ childId: string; firstName: string; lastName: string; email: string }>(
    `SELECT pc."childId" as "childId", u."firstName", u."lastName", u.email
     FROM "ParentChild" pc JOIN "User" u ON pc."childId" = u.id
     WHERE pc."parentId" = $1 AND pc.verified = true`,
    [session.userId]
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Parent Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back. Monitor your children&apos;s grades and progress.
      </p>
      <div className="grid gap-6">
        {children.map((child) => (
          <Link
            key={child.childId}
            href={`/parent/children/${child.childId}`}
            className="block p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition"
          >
            <h3 className="font-semibold text-lg">
              {child.firstName} {child.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">{child.email}</p>
            <p className="text-sm mt-2 text-primary">View grades and progress →</p>
          </Link>
        ))}
        {children.length === 0 && (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No children linked. Contact the school to link your account.
          </div>
        )}
      </div>
    </div>
  );
}
