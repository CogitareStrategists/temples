import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();
  const r = user.role;
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-kumkum">Dashboard</h1>
      <p className="mb-6 text-muted">Welcome, {user.name}.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/temples" className="card p-5 hover:border-saffron">
          <h2 className="font-display text-lg text-ink">Temples</h2>
          <p className="text-sm text-muted">View and edit temple information.</p>
        </Link>
        {(r === "super_admin" || r === "temple_manager") && (
          <Link href="/dashboard/temples/new" className="card p-5 hover:border-saffron">
            <h2 className="font-display text-lg text-ink">Add a Temple</h2>
            <p className="text-sm text-muted">Create a new temple (pending Super Admin approval).</p>
          </Link>
        )}
        <Link href="/dashboard/payments" className="card p-5 hover:border-saffron">
          <h2 className="font-display text-lg text-ink">Payments</h2>
          <p className="text-sm text-muted">
            {r === "temple_admin" ? "Choose a plan and pay via UPI." : "View payment status by temple."}
          </p>
        </Link>
        {(r === "super_admin" || r === "temple_manager") && (
          <Link href="/dashboard/suggestions" className="card p-5 hover:border-saffron">
            <h2 className="font-display text-lg text-ink">Suggestions</h2>
            <p className="text-sm text-muted">Propose new deities, categories or field changes.</p>
          </Link>
        )}
        {r === "super_admin" && (
          <>
            <Link href="/dashboard/approvals" className="card p-5 hover:border-saffron">
              <h2 className="font-display text-lg text-ink">Approvals</h2>
              <p className="text-sm text-muted">Approve new temples and review backups.</p>
            </Link>
            <Link href="/dashboard/users" className="card p-5 hover:border-saffron">
              <h2 className="font-display text-lg text-ink">Users</h2>
              <p className="text-sm text-muted">Create temple managers and temple admins.</p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
