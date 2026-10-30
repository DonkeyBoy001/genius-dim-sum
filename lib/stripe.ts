import Stripe from "stripe";
import { sessionPaysOrder } from "./checkout.ts";
import { serviceClient } from "./supabase.ts";
import type { Order } from "./types.ts";

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

// Server only.
export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  client ??= new Stripe(key);
  return client;
}

// Records a completed Checkout Session on its order. Called from the
// webhook and when the customer lands back on the site, so it must be safe
// to run twice. Returns the order, or null if the session doesn't pay one.
export async function recordCheckout(session: Stripe.Checkout.Session): Promise<Order | null> {
  const orderId = session.metadata?.order_id;
  if (!orderId) return null;
  const db = serviceClient();
  const { data: order, error } = await db.from("orders").select("*").eq("id", orderId).maybeSingle<Order>();
  if (error || !order) {
    console.error("checkout for unknown order", orderId, error);
    return null;
  }
  if (!sessionPaysOrder(session, order)) {
    if (session.payment_status === "paid") console.error("checkout amount mismatch", order.code, session.id);
    return null;
  }
  if (order.paid_via === "stripe") return order;

  const paid = { paid_via: "stripe", paid_at: new Date().toISOString(), stripe_session_id: session.id };
  // A cancelled order keeps its status, but shows it was paid so the shop
  // knows to refund it.
  const status = order.status === "new" ? "paid" : order.status;
  const { error: updateError } = await db.from("orders").update({ ...paid, status }).eq("id", order.id);
  if (updateError) throw updateError;
  return { ...order, ...paid, status } as Order;
}
