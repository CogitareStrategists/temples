import { requireRole } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import type { TempleRow } from "@/lib/types";
import { listPendingAdminRequests } from "@/lib/queries/admin-requests";
import {
  approveTempleAction,
  rejectTempleAction,
  approveTempleAdminRequestAction,
  rejectTempleAdminRequestAction,
} from "@/app/(dashboard)/actions";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireRole("super_admin");
  const [pending, adminRequests] = await Promise.all([
    query<TempleRow>`select * from temples where status = 'pending_approval' order by created_at asc`,
    listPendingAdminRequests(),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Approvals</h1>
        <p className="mb-6 text-sm text-muted">
          New temples require approval before going live. On first approval an immutable original backup is stored.
        </p>
        {pending.length === 0 ? (
          <p className="text-muted">No temples pending. 🙏</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((t) => (
              <li key={t.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-lg text-ink">{t.name_en}{t.name_te ? ` · ${t.name_te}` : ""}</p>
                  <p className="text-sm text-muted">{[t.city, t.district, t.state].filter(Boolean).join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <form action={approveTempleAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-primary">Approve &amp; publish</button>
                  </form>
                  <form action={rejectTempleAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-ghost">Reject</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-display text-2xl font-semibold text-kumkum">Temple admin requests</h2>
        <p className="mb-4 text-sm text-muted">
          Managers proposed these people to manage a temple. Approving creates their login (set a password) and assigns
          them. If an account with that email already exists, it is linked instead.
        </p>
        {adminRequests.length === 0 ? (
          <p className="text-muted">No admin requests pending.</p>
        ) : (
          <ul className="space-y-3">
            {adminRequests.map((r) => (
              <li key={r.id} className="card flex flex-col gap-3 p-5">
                <div>
                  <p className="font-display text-lg text-ink">{r.full_name}</p>
                  <p className="text-sm text-muted">
                    {r.email}{r.phone ? ` · ${r.phone}` : ""} — for <strong>{r.temple_name_en}</strong>
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <form action={approveTempleAdminRequestAction} className="flex flex-1 flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <div className="flex-1">
                      <label className="label">Set a password (for a new account)</label>
                      <input className="input" name="password" type="text" placeholder="Temporary password" />
                    </div>
                    <button className="btn-primary">Approve &amp; assign</button>
                  </form>
                  <form action={rejectTempleAdminRequestAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-ghost">Reject</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
