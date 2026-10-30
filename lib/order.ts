import type { MenuItem, OrderLine } from "./types.ts";

export type OrderInput = {
  name?: unknown;
  contact?: unknown;
  pickup_time?: unknown;
  note?: unknown;
  items?: unknown;
};

export type PricedOrder = {
  customer_name: string;
  contact: string;
  pickup_time: string;
  note: string | null;
  items: OrderLine[];
  total_cents: number;
};

const MAX_QTY = 50;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Validates a customer's order against the live menu and prices it on the
// server, so a tampered request can't change prices or order sold-out items.
export function priceOrder(input: OrderInput, menu: MenuItem[], slots: string[]): PricedOrder | { error: string } {
  const customer_name = text(input.name, 40);
  const contact = text(input.contact, 60);
  const pickup_time = text(input.pickup_time, 20);
  const note = text(input.note, 200) || null;

  if (!customer_name) return { error: "请填写称呼。" };
  if (!contact) return { error: "请留电话或微信号。" };
  if (!slots.includes(pickup_time)) return { error: "请选择取餐时间。" };
  if (!Array.isArray(input.items) || input.items.length === 0) return { error: "先选至少一样点心。" };

  const byId = new Map(menu.map((m) => [m.id, m]));
  const qtyById = new Map<string, number>();
  for (const raw of input.items) {
    const id = typeof raw?.id === "string" ? raw.id : "";
    const qty = typeof raw?.qty === "number" ? raw.qty : NaN;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { error: "数量不对，请重新选择。" };
    qtyById.set(id, (qtyById.get(id) ?? 0) + qty);
  }

  const items: OrderLine[] = [];
  for (const [id, qty] of qtyById) {
    const m = byId.get(id);
    if (!m || m.hidden) return { error: "有一样点心已经下架了，请刷新页面。" };
    if (m.sold_out) return { error: `${m.name_zh}刚刚售罄了，请去掉后再下单。` };
    if (qty > MAX_QTY) return { error: "数量不对，请重新选择。" };
    items.push({ id, name_zh: m.name_zh, name_en: m.name_en, qty, price_cents: m.price_cents });
  }

  const total_cents = items.reduce((sum, l) => sum + l.price_cents * l.qty, 0);
  return { customer_name, contact, pickup_time, note, items, total_cents };
}

// Short code the customer writes in the payment note, e.g. TC7K3P.
export function orderCode(rand: () => number = Math.random): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "TC";
  for (let i = 0; i < 4; i++) c += chars[Math.floor(rand() * chars.length)];
  return c;
}
