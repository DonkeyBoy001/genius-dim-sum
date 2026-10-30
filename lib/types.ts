export type Category = "dimsum" | "bun" | "drink";

export type MenuItem = {
  id: string;
  category: Category;
  name_zh: string;
  name_en: string;
  portion: string;
  price_cents: number;
  tagline: string;
  image_url: string | null;
  sold_out: boolean;
  is_new: boolean;
  recommended: boolean;
  hidden: boolean;
  sort: number;
};

export type OrderLine = { id: string; name_zh: string; name_en: string; qty: number; price_cents: number };

export type OrderStatus = "new" | "paid" | "picked_up" | "cancelled";

export type Order = {
  id: string;
  code: string;
  customer_name: string;
  contact: string;
  pickup_time: string;
  note: string | null;
  items: OrderLine[];
  total_cents: number;
  status: OrderStatus;
  created_at: string;
};

export const CATEGORIES: { key: Category; zh: string; en: string }[] = [
  { key: "dimsum", zh: "港式经典点心", en: "Dim Sum" },
  { key: "bun", zh: "特色流沙包", en: "Custard Buns" },
  { key: "drink", zh: "饮品", en: "Beverages" },
];

export const money = (cents: number) => "$" + (cents / 100).toFixed(2);
