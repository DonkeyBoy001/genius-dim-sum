"use client";

import { useEffect, useState } from "react";
import { SITE, isOpenNow } from "@/lib/site";

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
      <span>{open === null ? `营业时间 ${SITE.hoursShort}` : open ? `营业中 · ${SITE.closesLabel}打烊` : `今天${SITE.opensLabel}开门`}</span>
    </span>
  );
}
