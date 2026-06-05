"use client";
import { useState } from "react";
import { PayButton } from "@/components/PayButton";
import type { SubscriptionPlanRow } from "@/lib/types";

export function PaymentPanel({
  temples,
  plans,
}: {
  temples: { id: string; name_en: string; subscription_valid_until: string | null }[];
  plans: SubscriptionPlanRow[];
}) {
  const [templeId, setTempleId] = useState<string | null>(temples[0]?.id ?? null);
  const selected = temples.find((t) => t.id === templeId);

  if (temples.length === 0) return <p className="text-muted">No temples available.</p>;

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Temple</label>
        <select className="input max-w-md" value={templeId ?? ""} onChange={(e) => setTempleId(e.target.value)}>
          {temples.map((t) => (
            <option key={t.id} value={t.id}>{t.name_en}</option>
          ))}
        </select>
        {selected && (
          <p className="mt-1 text-sm text-muted">
            {selected.subscription_valid_until
              ? `Active until ${selected.subscription_valid_until}`
              : "No active plan"}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="card p-5 text-center">
            <h3 className="font-display text-lg text-kumkum">{p.name_en}</h3>
            <p className="my-2 text-2xl font-semibold">₹{Number(p.amount_inr).toFixed(0)}</p>
            <p className="mb-4 text-xs text-muted">{p.duration_months} month(s) · renewals stack</p>
            <PayButton templeId={templeId} planId={p.id} label="Pay & activate" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        Test mode: UPI <code>success@razorpay</code>, or card <code>4111 1111 1111 1111</code> (any future expiry/CVV).
      </p>
    </div>
  );
}
