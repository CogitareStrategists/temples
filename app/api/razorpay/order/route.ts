import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razorpayClient } from "@/lib/razorpay";
import { getPlan, createPendingPayment } from "@/lib/queries/subscriptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { temple_id, plan_id } = (await req.json()) as { temple_id?: string; plan_id?: string };
  if (!temple_id || !plan_id) return NextResponse.json({ error: "Missing temple_id or plan_id" }, { status: 400 });

  const plan = await getPlan(plan_id);
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const amountInr = Number(plan.amount_inr);
  const amountPaise = Math.round(amountInr * 100);

  try {
    const order = await razorpayClient().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `tpl_${temple_id.slice(0, 8)}_${Date.now()}`,
      notes: { temple_id, plan_id, plan_code: plan.code },
    });
    await createPendingPayment(temple_id, plan_id, amountInr, order.id, session.user.id);
    return NextResponse.json({
      order_id: order.id,
      amount: amountPaise,
      currency: "INR",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan_name: plan.name_en,
    });
  } catch (e) {
    console.error("razorpay order error", e);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
