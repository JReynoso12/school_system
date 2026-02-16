import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || !["SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    redirect("/login");
  }

  const tenant = await queryOne<{
    name: string;
    slug: string;
    timezone: string;
    planTier: string;
    seatCount: number;
    renewalAt: Date | null;
  }>('SELECT name, slug, timezone, "planTier", "seatCount", "renewalAt" FROM "Tenant" WHERE id = $1', [
    session.tenantId,
  ]);

  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Organization Name
          </label>
          <p className="font-medium">{tenant.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Slug
          </label>
          <p className="font-mono">{tenant.slug}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Timezone
          </label>
          <p>{tenant.timezone}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Plan Tier
          </label>
          <p className="capitalize">{tenant.planTier}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Seat Count
          </label>
          <p>{tenant.seatCount}</p>
        </div>
        {tenant.renewalAt && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Renewal Date
            </label>
            <p>{tenant.renewalAt.toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
