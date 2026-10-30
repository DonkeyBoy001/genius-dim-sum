import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutLineItems, sessionPaysOrder } from "./checkout.ts";

const order = {
  total_cents: 699 * 2 + 200,
  items: [
    { id: "hargow", name_zh: "虾饺", name_en: "Shrimp Dumplings (Har Gow)", qty: 2, price_cents: 699 },
    { id: "coke", name_zh: "可乐", name_en: "", qty: 1, price_cents: 200 },
  ],
};

test("line items use the order's saved prices and add up to its total", () => {
  const items = checkoutLineItems(order);
  assert.equal(items[0].price_data.product_data.name, "虾饺 Shrimp Dumplings (Har Gow)");
  assert.equal(items[1].price_data.product_data.name, "可乐");
  const sum = items.reduce((a, l) => a + l.price_data.unit_amount * l.quantity, 0);
  assert.equal(sum, order.total_cents);
});

test("a session pays an order only when paid in full, in USD", () => {
  const paid = { payment_status: "paid", amount_total: order.total_cents, currency: "usd" };
  assert.equal(sessionPaysOrder(paid, order), true);
  assert.equal(sessionPaysOrder({ ...paid, payment_status: "unpaid" }, order), false);
  assert.equal(sessionPaysOrder({ ...paid, amount_total: 1 }, order), false);
  assert.equal(sessionPaysOrder({ ...paid, currency: "eur" }, order), false);
});
