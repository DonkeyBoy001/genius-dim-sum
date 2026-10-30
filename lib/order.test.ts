import { test } from "node:test";
import assert from "node:assert/strict";
import { priceOrder, orderCode } from "./order.ts";
import { SEED_MENU } from "./menu-seed.ts";

const slots = ["尽快 ASAP", "7:00 PM"];
const base = { name: "陈小姐", contact: "917-555-0100", pickup_time: "尽快 ASAP" };

test("prices an order from the menu, ignoring client prices", () => {
  const r = priceOrder({ ...base, items: [{ id: "hargow", qty: 2, price_cents: 1 }, { id: "coke", qty: 1 }] }, SEED_MENU, slots);
  assert.ok(!("error" in r));
  assert.equal(r.total_cents, 699 * 2 + 200);
  assert.equal(r.items[0].price_cents, 699);
});

test("merges duplicate lines", () => {
  const r = priceOrder({ ...base, items: [{ id: "siumai", qty: 1 }, { id: "siumai", qty: 2 }] }, SEED_MENU, slots);
  assert.ok(!("error" in r));
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].qty, 3);
});

test("rejects sold-out, unknown and hidden items", () => {
  const menu = SEED_MENU.map((m) => (m.id === "xlb" ? { ...m, sold_out: true } : m.id === "water" ? { ...m, hidden: true } : m));
  assert.ok("error" in priceOrder({ ...base, items: [{ id: "xlb", qty: 1 }] }, menu, slots));
  assert.ok("error" in priceOrder({ ...base, items: [{ id: "water", qty: 1 }] }, menu, slots));
  assert.ok("error" in priceOrder({ ...base, items: [{ id: "nope", qty: 1 }] }, menu, slots));
});

test("rejects bad quantities, missing fields and unknown pickup times", () => {
  for (const qty of [0, -1, 1.5, 51, "2"]) {
    assert.ok("error" in priceOrder({ ...base, items: [{ id: "hargow", qty }] }, SEED_MENU, slots), `qty ${qty}`);
  }
  assert.ok("error" in priceOrder({ ...base, name: " ", items: [{ id: "hargow", qty: 1 }] }, SEED_MENU, slots));
  assert.ok("error" in priceOrder({ ...base, contact: "", items: [{ id: "hargow", qty: 1 }] }, SEED_MENU, slots));
  assert.ok("error" in priceOrder({ ...base, pickup_time: "4:00 AM", items: [{ id: "hargow", qty: 1 }] }, SEED_MENU, slots));
  assert.ok("error" in priceOrder({ ...base, items: [] }, SEED_MENU, slots));
});

test("order codes look like TCXXXX", () => {
  assert.match(orderCode(), /^TC[A-Z2-9]{4}$/);
});
