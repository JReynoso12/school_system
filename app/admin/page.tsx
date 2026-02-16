import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { School, Users, BookOpen } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const [schoolsRes, usersRes, subjectsRes] = await Promise.all([
    query<{ count: string }>(
      'SELECT COUNT(*)::int as count FROM "School" s JOIN "District" d ON s."districtId" = d.id WHERE d."tenantId" = $1',
      [session.tenantId]
    ),
    query<{ count: string }>(
      'SELECT COUNT(*)::int as count FROM "User" WHERE "tenantId" = $1',
      [session.tenantId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM "Subject" sb
       JOIN "School" s ON sb."schoolId" = s.id JOIN "District" d ON s."districtId" = d.id
       WHERE d."tenantId" = $1`,
      [session.tenantId]
    ),
  ]);
  const schoolsCount = Number(schoolsRes.rows[0]?.count ?? 0);
  const usersCount = Number(usersRes.rows[0]?.count ?? 0);
  const subjectsCount = Number(subjectsRes.rows[0]?.count ?? 0);

  const statCards = [
    {
      href: "/admin/schools",
      label: "Schools",
      value: schoolsCount,
      description: "Manage schools",
      icon: School,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      href: "/admin/users",
      label: "Users",
      value: usersCount,
      description: "Manage users",
      icon: Users,
      bgColor: "bg-secondary/20",
      iconColor: "text-secondary",
    },
    {
      href: "/admin/subjects",
      label: "Subjects",
      value: subjectsCount,
      description: "Curriculum setup",
      icon: BookOpen,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.email}. Here&apos;s what&apos;s happening with
          your schools today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <div className="p-6 bg-card rounded-2xl shadow-card hover:shadow-soft transition-all border border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {card.value.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {card.description}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/schools"
              className="block p-4 rounded-xl bg-muted/50 hover:bg-accent transition"
            >
              <p className="font-medium">Manage Schools</p>
              <p className="text-sm text-muted-foreground">
                View and configure schools
              </p>
            </Link>
            <Link
              href="/admin/users"
              className="block p-4 rounded-xl bg-muted/50 hover:bg-accent transition"
            >
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-muted-foreground">
                Add and manage user accounts
              </p>
            </Link>
            <Link
              href="/admin/academic-years"
              className="block p-4 rounded-xl bg-muted/50 hover:bg-accent transition"
            >
              <p className="font-medium">Academic Years</p>
              <p className="text-sm text-muted-foreground">
                Set up terms and semesters
              </p>
            </Link>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-primary/10">
              <span className="text-muted-foreground">Total Schools</span>
              <span className="text-xl font-bold text-primary">
                {schoolsCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-secondary/5 border border-secondary/10">
              <span className="text-muted-foreground">Total Users</span>
              <span className="text-xl font-bold text-secondary">
                {usersCount}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <span className="text-muted-foreground">Subjects</span>
              <span className="text-xl font-bold text-amber-600">
                {subjectsCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
