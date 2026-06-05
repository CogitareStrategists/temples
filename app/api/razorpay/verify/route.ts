import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { activateOnPayment } from "@/lib/queries/subscriptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ verified: false }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, method } = (await req.json()) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    method?: string;
  };
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ verified: false, error: "Missing fields" }, { status: 400 });
  }

  // Security-critical: never activate without a valid server-side signature.
  const ok = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!ok) return NextResponse.json({ verified: false }, { status: 400 });

  await activateOnPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, method ?? null);
  return NextResponse.json({ verified: true });
}
