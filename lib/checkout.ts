import type { Order } from "./types.ts";

// Stripe Checkout line items for an order, built from the prices saved on
// the order (which the server already checked against the menu).
export function checkoutLineItems(order: Pick<Order, "items">) {
  return order.items.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: "usd",
      unit_amount: l.price_cents,
      product_data: { name: l.name_en ? `${l.name_zh} ${l.name_en}` : l.name_zh },
    },
  }));
}

type PaidSession = { payment_status: string; amount_total: number | null; currency: string | null };

// A Checkout Session only counts as paying an order when Stripe says it's
// paid and the amount matches the order total exactly.
export function sessionPaysOrder(session: PaidSession, order: Pick<Order, "total_cents">): boolean {
  return session.payment_status === "paid" && session.currency === "usd" && session.amount_total === order.total_cents;
}
