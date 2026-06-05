"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function PayButton({
  templeId,
  planId,
  label,
  disabled,
}: {
  templeId: string | null;
  planId: string;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function pay() {
    if (!templeId) {
      setMsg("Select a temple first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temple_id: templeId, plan_id: planId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Order failed");
      if (!window.Razorpay) throw new Error("Razorpay not loaded yet — try again in a moment.");

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Devalayam",
        description: order.plan_name,
        order_id: order.order_id,
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          });
          const out = await v.json();
          if (out.verified) {
            setMsg("Payment successful — subscription activated.");
            router.refresh();
          } else {
            setMsg("Payment could not be verified.");
          }
        },
        theme: { color: "#8c1d18" },
      });
      rzp.open();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={pay} className="btn-primary" disabled={busy || disabled}>
        {busy ? "…" : label}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
