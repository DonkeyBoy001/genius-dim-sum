import type { MenuItem } from "./types.ts";

// The opening menu (2026-10-30). Used as the database seed and as a fallback
// when Supabase is not configured yet, so the site still renders.
export const SEED_MENU: MenuItem[] = [
  { id: "hargow", category: "dimsum", name_zh: "虾饺", name_en: "Shrimp Dumplings (Har Gow)", portion: "4只 / 4 pcs", price_cents: 699, tagline: "鲜虾饱满", image_url: "/img/hargow.jpg", sold_out: false, is_new: false, recommended: false, hidden: false, sort: 10 },
  { id: "siumai", category: "dimsum", name_zh: "烧卖", name_en: "Pork & Shrimp Siu Mai", portion: "4只 / 4 pcs", price_cents: 699, tagline: "经典港味", image_url: "/img/siumai.jpg", sold_out: false, is_new: false, recommended: false, hidden: false, sort: 20 },
  { id: "cheungfun", category: "dimsum", name_zh: "虾仁肠粉", name_en: "Shrimp Rice Noodle Rolls", portion: "2条 / 2 rolls", price_cents: 799, tagline: "爽滑鲜美", image_url: "/img/cheungfun.jpg", sold_out: false, is_new: false, recommended: false, hidden: false, sort: 30 },
  { id: "xlb", category: "dimsum", name_zh: "小笼包", name_en: "Soup Dumplings (Xiao Long Bao)", portion: "4只 / 4 pcs", price_cents: 799, tagline: "汤汁鲜美", image_url: "/img/xlb.jpg", sold_out: false, is_new: false, recommended: false, hidden: false, sort: 40 },
  { id: "liusha", category: "bun", name_zh: "黄流沙包", name_en: "Salted Egg Custard Buns", portion: "2只 / 2 pcs", price_cents: 699, tagline: "流沙香浓", image_url: "/img/liusha.jpg", sold_out: false, is_new: false, recommended: false, hidden: false, sort: 50 },
  { id: "heijin", category: "bun", name_zh: "黑金流沙包", name_en: "Black Gold Custard Buns", portion: "2只 / 2 pcs", price_cents: 799, tagline: "独特风味", image_url: "/img/heijin.jpg", sold_out: false, is_new: true, recommended: true, hidden: false, sort: 60 },
  { id: "coke", category: "drink", name_zh: "可乐", name_en: "Coca-Cola", portion: "1罐 / 1 can", price_cents: 200, tagline: "", image_url: null, sold_out: false, is_new: false, recommended: false, hidden: false, sort: 70 },
  { id: "water", category: "drink", name_zh: "瓶装水", name_en: "Bottled Water", portion: "1瓶 / 1 bottle", price_cents: 200, tagline: "", image_url: null, sold_out: false, is_new: false, recommended: false, hidden: false, sort: 80 },
];
