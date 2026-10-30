"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const METHODS = [
  { key: "venmo", label: "Venmo", img: "/img/pay-venmo.png", cap: `Venmo ${SITE.venmo}` },
  { key: "alipay", label: "支付宝 Alipay", img: "/img/pay-alipay.png", cap: "支付宝 Alipay" },
];

export default function PayMethods() {
  const [open, setOpen] = useState<string | null>(null);
  const shown = METHODS.find((m) => m.key === open);
  return (
    <>
      <div className="pay">
        {METHODS.map((m) => (
          <button key={m.key} type="button" aria-expanded={open === m.key} onClick={() => setOpen(open === m.key ? null : m.key)}>
            {m.label}
          </button>
        ))}
      </div>
      {shown && (
        <div className="qr pay-qr">
          <img src={shown.img} alt={`${shown.cap} 收款码`} />
          <div className="cap">{shown.cap}</div>
          <div className="hint">付款备注请写订单号或你的称呼</div>
        </div>
      )}
    </>
  );
}
