// Shop details shown across the site. Edit here, then redeploy.
export const SITE = {
  nameZh: "天才港点",
  nameEn: "GENIUS DIM SUM",
  tagline: "港式点心 · 经典早茶 · 现蒸现卖",
  motto: "一笼热气，一口港味！",
  mottoEn: "Freshly Steamed, Full of Hong Kong Flavor!",
  location: "Orchard 楼下",
  hoursLabel: "7:00 PM – 3:00 AM",
  timeZone: "America/New_York",
  openHour: 19, // 7 PM
  closeHour: 3, // 3 AM next day
  orderContact: "点餐客服小月",
  wechatId: "", // fill in when known
  venmo: "@jaszzz",
};

// Pickup slots every 30 min from opening until 30 min before closing.
export function pickupSlots(): string[] {
  const slots = ["尽快 ASAP"];
  const end = (SITE.closeHour + 24) * 60 - 30;
  for (let m = SITE.openHour * 60; m <= end; m += 30) {
    const h24 = Math.floor(m / 60) % 24;
    const mm = m % 60;
    const h12 = h24 % 12 || 12;
    slots.push(`${h12}:${String(mm).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`);
  }
  return slots;
}

export function isOpenNow(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: SITE.timeZone, hour: "numeric", hour12: false })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value,
  ) % 24;
  return hour >= SITE.openHour || hour < SITE.closeHour;
}
