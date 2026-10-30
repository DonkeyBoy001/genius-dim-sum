// Shop details shown across the site. Edit here, then redeploy.
export const SITE = {
  nameZh: "天才港点",
  nameEn: "GENIUS DIM SUM",
  tagline: "港式点心 · 经典早茶 · 现蒸现卖",
  motto: "一笼热气，一口港味！",
  mottoEn: "Freshly Steamed, Full of Hong Kong Flavor!",
  location: "Orchard 楼下",
  hoursLabel: "4:30 PM – 1:00 AM",
  hoursShort: "4:30PM–1AM",
  opensLabel: "下午 4:30",
  closesLabel: "凌晨 1 点",
  timeZone: "America/New_York",
  openMinute: 16 * 60 + 30, // 4:30 PM
  closeMinute: 1 * 60, // 1:00 AM next day
  orderContact: "点餐客服小月",
  wechatId: "", // fill in when known
  venmo: "@jaszzz",
};

// Pickup slots every 30 min from opening until 30 min before closing.
export function pickupSlots(): string[] {
  const slots = ["尽快 ASAP"];
  const end = SITE.closeMinute + 24 * 60 - 30;
  for (let m = SITE.openMinute; m <= end; m += 30) {
    const h24 = Math.floor(m / 60) % 24;
    const mm = m % 60;
    const h12 = h24 % 12 || 12;
    slots.push(`${h12}:${String(mm).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`);
  }
  return slots;
}

export function isOpenNow(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: SITE.timeZone, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const m = (get("hour") % 24) * 60 + get("minute");
  return m >= SITE.openMinute || m < SITE.closeMinute;
}
