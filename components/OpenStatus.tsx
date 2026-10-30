"use client";

import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/site";

export default function OpenStatus() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={"status" + (open ? " open" : "")}>
      <span className="dot" />
      <span>{open === null ? "营业时间 7PM–3AM" : open ? "营业中 · 凌晨 3 点打烊" : "今晚 7 点开门"}</span>
    </span>
  );
}
