import { query, queryOne } from "@/lib/db";
import type { SubscriptionPlanRow, SubscriptionRow, PaymentRow } from "@/lib/types";

export async function listPlans(): Promise<SubscriptionPlanRow[]> {
  return query<SubscriptionPlanRow>`
    select * from subscription_plans where status = 'active' order by duration_months`;
}
export async function getPlan(id: string): Promise<SubscriptionPlanRow | null> {
  return queryOne<SubscriptionPlanRow>`select * from subscription_plans where id = ${id} limit 1`;
}

export interface TemplePaymentStatus {
  temple_id: string;
  name_en: string;
  status: string;
  subscription_valid_until: string | null;
  last_payment_status: string | null;
  last_payment_at: string | null;
}

export async function paymentStatusByTemple(): Promise<TemplePaymentStatus[]> {
  return query<TemplePaymentStatus>`
    select t.id as temple_id, t.name_en, t.status, t.subscription_valid_until,
           p.status as last_payment_status, p.created_at as last_payment_at
    from temples t
    left join lateral (
      select status, created_at from payments
      where temple_id = t.id order by created_at desc limit 1
    ) p on true
    order by t.name_en`;
}

/** Create a pending subscription + payment row for a Razorpay order. */
export async function createPendingPayment(
  templeId: string,
  planId: string,
  amountInr: number,
  razorpayOrderId: string,
  userId: string
): Promise<{ subscription: SubscriptionRow; payment: PaymentRow }> {
  const subscription = await queryOne<SubscriptionRow>`
    insert into subscriptions (temple_id, plan_id, amount_inr, status)
    values (${templeId}, ${planId}, ${amountInr}, 'pending_payment') returning *`;
  const payment = await queryOne<PaymentRow>`
    insert into payments (temple_id, subscription_id, amount_inr, status, razorpay_order_id, initiated_by)
    values (${templeId}, ${subscription!.id}, ${amountInr}, 'created', ${razorpayOrderId}, ${userId})
    returning *`;
  return { subscription: subscription!, payment: payment! };
}

/** On verified payment: mark paid, activate subscription, extend temple validity. */
export async function activateOnPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  method: string | null
): Promise<void> {
  const payment = await queryOne<PaymentRow>`
    select * from payments where razorpay_order_id = ${razorpayOrderId} limit 1`;
  if (!payment) throw new Error("Payment not found for order");
  if (payment.status === "paid") return; // already activated (idempotent for webhook + browser)
  await queryOne`
    update payments set status = 'paid', razorpay_payment_id = ${razorpayPaymentId},
      razorpay_signature = ${razorpaySignature}, method = ${method}, paid_at = now()
    where id = ${payment.id}`;
  const sub = await queryOne<SubscriptionRow>`
    select s.*, sp.duration_months from subscriptions s
    join subscription_plans sp on sp.id = s.plan_id
    where s.id = ${payment.subscription_id} limit 1`;
  if (!sub) return;
  const months = (sub as unknown as { duration_months: number }).duration_months;
  // Extend from the later of today or current validity (stacking renewals).
  await queryOne`
    update subscriptions set status = 'active',
      start_date = current_date,
      end_date = (greatest(current_date,
                   coalesce((select subscription_valid_until from temples where id = ${payment.temple_id}), current_date))
                  + (${months} || ' months')::interval)::date
    where id = ${sub.id}`;
  await queryOne`
    update temples set subscription_valid_until =
      (select end_date from subscriptions where id = ${sub.id})
    where id = ${payment.temple_id}`;
}

/** Super-Admin offline/manual payment: log it and extend validity (stacking). */
export async function recordManualPayment(
  templeId: string,
  planId: string,
  amountInr: number | null,
  method: string,
  paidAt: string | null,
  adminId: string
): Promise<void> {
  const plan = await queryOne<SubscriptionPlanRow>`select * from subscription_plans where id = ${planId} limit 1`;
  if (!plan) throw new Error("Plan not found");
  const months = plan.duration_months;
  const amount = amountInr ?? Number(plan.amount_inr);
  const subscription = await queryOne<SubscriptionRow>`
    insert into subscriptions (temple_id, plan_id, amount_inr, status, start_date, end_date)
    values (
      ${templeId}, ${planId}, ${amount}, 'active', current_date,
      (greatest(current_date,
        coalesce((select subscription_valid_until from temples where id = ${templeId}), current_date))
       + (${months} || ' months')::interval)::date
    ) returning *`;
  await queryOne`
    insert into payments (temple_id, subscription_id, amount_inr, status, method, initiated_by, paid_at)
    values (${templeId}, ${subscription!.id}, ${amount}, 'paid', ${method}, ${adminId},
            coalesce(${paidAt}::timestamptz, now()))`;
  await queryOne`
    update temples set subscription_valid_until = ${subscription!.end_date} where id = ${templeId}`;
}
