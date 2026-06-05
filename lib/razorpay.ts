import crypto from "crypto";
import Razorpay from "razorpay";

export function razorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys are not configured");
  return new Razorpay({ key_id, key_secret });
}

/**
 * Verify the Razorpay payment signature server-side.
 * HMAC-SHA256 of `${order_id}|${payment_id}` keyed by RAZORPAY_KEY_SECRET.
 * Never mark a payment paid without this check passing.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  // constant-time compare
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verify a Razorpay *webhook* signature: HMAC-SHA256 of the raw request body
 * keyed by RAZORPAY_WEBHOOK_SECRET, compared (constant-time) to the
 * `x-razorpay-signature` header.
 */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
