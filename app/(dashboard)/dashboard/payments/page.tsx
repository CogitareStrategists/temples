import { requireUser } from "@/lib/auth-helpers";
import { query } from "@/lib/db";
import { listPlans, paymentStatusByTemple } from "@/lib/queries/subscriptions";
import { PaymentPanel } from "@/components/PaymentPanel";

export const dynamic = "force-dynamic";

type TempleLite = { id: string; name_en: string; subscription_valid_until: string | null };

export default async function PaymentsPage() {
  const user = await requireUser();
  const plans = await listPlans();

  const temples =
    user.role === "temple_admin"
      ? await query<TempleLite>`
          select id, name_en, subscription_valid_until from temples t
          where exists (select 1 from temple_admins ta where ta.temple_id = t.id and ta.user_id = ${user.id})
          order by name_en`
      : await query<TempleLite>`
          select id, name_en, subscription_valid_until from temples order by name_en`;

  const showStatusTable = user.role !== "temple_admin";
  const statuses = showStatusTable ? await paymentStatusByTemple() : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-3xl font-semibold text-kumkum">Payments</h1>
        <p className="text-sm text-muted">
          Plans are paid durations — features are identical across plans. On expiry the public page stays visible; only
          the Temple Admin’s editing locks.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-kumkum">Take a payment</h2>
        <PaymentPanel temples={temples} plans={plans} />
      </section>

      {showStatusTable && (
        <section>
          <h2 className="mb-3 font-display text-xl text-kumkum">Status by temple</h2>
          <div className="overflow-hidden rounded-xl border border-ink/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-sandal text-muted">
                <tr>
                  <th className="px-4 py-2">Temple</th>
                  <th className="px-4 py-2">Active until</th>
                  <th className="px-4 py-2">Last payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5 bg-white">
                {statuses.map((s) => (
                  <tr key={s.temple_id}>
                    <td className="px-4 py-2 font-medium">{s.name_en}</td>
                    <td className="px-4 py-2">{s.subscription_valid_until ?? "—"}</td>
                    <td className="px-4 py-2">
                      {s.last_payment_status ?? "—"}
                      {s.last_payment_at ? ` · ${new Date(s.last_payment_at).toLocaleDateString()}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
