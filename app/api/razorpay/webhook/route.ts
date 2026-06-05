import { NextResponse } from "next/server";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { activateOnPayment } from "@/lib/queries/subscriptions";

export const dynamic = "force-dynamic";

// Razorpay calls this directly when a payment is captured, so subscriptions
// activate even if the payer's browser never returned to /verify.
// Configure the endpoint URL + secret in the Razorpay dashboard; the secret
// must match RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // Security-critical: ignore anything we can't verify came from Razorpay.
  if (!verifyRazorpayWebhook(raw, signature)) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  let body: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; method?: string } } };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (body.event === "payment.captured" || body.event === "order.paid") {
    const e = body.payload?.payment?.entity;
    if (e?.order_id && e?.id) {
      try {
        // Idempotent: a no-op if the browser /verify path already activated it.
        await activateOnPayment(e.order_id, e.id, "webhook", e.method ?? null);
      } catch (err) {
        // Unknown order (not created by us) or transient issue — ack anyway so
        // Razorpay doesn't retry forever; log for inspection.
        console.error("webhook activation skipped:", err);
      }
    }
  }

  // Always 200 once the signature is valid, to acknowledge receipt.
  return NextResponse.json({ received: true });
}
