"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, money, type MenuItem, type OrderLine } from "@/lib/types";
import { SITE, pickupSlots } from "@/lib/site";

type Cart = Record<string, number>;
type Placed = { code: string; total_cents: number; items: OrderLine[] };

const CART_KEY = "gds-cart";

export default function OrderMenu({ menu, orderingOpen }: { menu: MenuItem[]; orderingOpen: boolean }) {
  const visible = useMemo(() => menu.filter((m) => !m.hidden), [menu]);
  const [cart, setCart] = useState<Cart>({});
  const [form, setForm] = useState({ name: "", contact: "", pickup_time: pickupSlots()[0], note: "", website: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      if (saved && typeof saved === "object") setCart(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  const lines = visible
    .filter((m) => cart[m.id] > 0 && !m.sold_out)
    .map((m) => ({ m, n: cart[m.id], sub: m.price_cents * cart[m.id] }));
  const count = lines.reduce((a, l) => a + l.n, 0);
  const total = lines.reduce((a, l) => a + l.sub, 0);

  useEffect(() => {
    document.body.classList.toggle("has-cart", count > 0 && !placed);
  }, [count, placed]);

  const bump = (id: string, d: number) =>
    setCart((c) => {
      const n = Math.max(0, (c[id] || 0) + d);
      const next = { ...c };
      if (n) next[id] = n;
      else delete next[id];
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = !lines.length ? "先在菜单里选至少一样点心。"
      : !form.name.trim() ? "请填写称呼，取餐时我们按名字叫你。"
      : !form.contact.trim() ? "请留电话或微信号，有问题我们好联系你。" : "";
    setError(problem);
    if (problem) return;
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, items: lines.map((l) => ({ id: l.m.id, qty: l.n })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "下单没成功，请再试一次。");
      setPlaced(data);
      setCart({});
      setTimeout(() => document.getElementById("placed")?.scrollIntoView({ block: "start" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络有问题，请再试一次。");
    } finally {
      setSending(false);
    }
  }

  const stepper = (m: MenuItem) => (
    <div className="stepper">
      <button type="button" aria-label={`${m.name_zh} 减一`} disabled={!cart[m.id]} onClick={() => bump(m.id, -1)}>−</button>
      <span className="n" aria-live="polite">{cart[m.id] || 0}</span>
      <button type="button" className="add" aria-label={`${m.name_zh} 加一`} disabled={m.sold_out || !orderingOpen} onClick={() => bump(m.id, 1)}>+</button>
    </div>
  );

  return (
    <>
      {CATEGORIES.map((cat) => {
        const items = visible
          .filter((m) => m.category === cat.key)
          .sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.sort - b.sort);
        if (!items.length) return null;
        return (
          <section className="menu-group" key={cat.key}>
            <div className="section-head"><h2>{cat.zh}</h2><span className="en">{cat.en}</span></div>
            {cat.key === "drink" ? (
              <div className="drinks">
                {items.map((m) => (
                  <div className={"drink" + (m.sold_out ? " sold-out" : "")} key={m.id}>
                    <div>
                      <div className="zh">{m.name_zh}{m.sold_out ? "（售罄）" : ""}</div>
                      <div className="en-name">{m.name_en} · {m.portion}</div>
                    </div>
                    <div className="right"><div className="price">{money(m.price_cents)}</div>{stepper(m)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid">
                {items.map((m) => (
                  <article className={"dish" + (m.sold_out ? " sold-out" : "")} key={m.id}>
                    {m.image_url ? <img className="photo" src={m.image_url} alt={`${m.name_zh} ${m.name_en}`} loading="lazy" /> : <div className="photo" />}
                    {(m.sold_out || m.is_new || m.recommended) && (
                      <div className="badges">
                        {m.sold_out && <span className="badge out">今日售罄 Sold Out</span>}
                        {m.is_new && <span className="badge">新品 NEW</span>}
                        {m.recommended && <span className="badge rec">店长推荐</span>}
                      </div>
                    )}
                    <div className="body">
                      <h3>{m.name_zh}</h3>
                      <div className="price">{money(m.price_cents)}</div>
                      <div className="en-name">{m.name_en}</div>
                      <div className="qty">{m.portion}</div>
                      {m.tagline && <div className="note">{m.tagline}</div>}
                      {stepper(m)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="menu-group" id="order">
        <div className="section-head"><h2>预点单</h2><span className="en">Pre-order for pickup</span></div>

        {!orderingOpen ? (
          <div className="order-card">
            <p className="empty">网上点单马上开通。现在请私聊{SITE.orderContact}下单，避免排队等待。</p>
          </div>
        ) : placed ? (
          <div className="order-card" id="placed">
            <h3>下单成功！你的订单号</h3>
            <div className="code">{placed.code}</div>
            <div className="lines">
              {placed.items.map((l) => (
                <div className="line" key={l.id}><span>{l.name_zh} × {l.qty}</span><span>{money(l.price_cents * l.qty)}</span></div>
              ))}
              <div className="line total"><span>应付 Total</span><span>{money(placed.total_cents)}</span></div>
            </div>
            <p className="paynote">扫下面任一收款码付 <strong>{money(placed.total_cents)}</strong>，付款备注写订单号 <strong>{placed.code}</strong>。我们确认收款后开始蒸，按取餐时间到 {SITE.location} 报订单号取餐。</p>
            <div className="qrs">
              <div className="qr"><img src="/img/pay-venmo.png" alt={`Venmo 收款码 ${SITE.venmo}`} /><div className="cap">Venmo {SITE.venmo}</div></div>
              <div className="qr"><img src="/img/pay-alipay.png" alt="支付宝收款码" /><div className="cap">支付宝 Alipay</div></div>
            </div>
            <p className="empty">有问题请私聊{SITE.orderContact}{SITE.wechatId ? `（微信 ${SITE.wechatId}）` : ""}。</p>
            <div><button className="btn outline" type="button" onClick={() => setPlaced(null)}>再点一单</button></div>
          </div>
        ) : (
          <form className="order-card" onSubmit={submit} noValidate>
            <h3>你的订单</h3>
            <div className="lines">
              {lines.length === 0 ? (
                <p className="empty">还没选点心。在上面的菜单里点“+”加进来。</p>
              ) : (
                <>
                  {lines.map((l) => (
                    <div className="line" key={l.m.id}><span>{l.m.name_zh} × {l.n}</span><span>{money(l.sub)}</span></div>
                  ))}
                  <div className="line total"><span>合计 Total</span><span>{money(total)}</span></div>
                </>
              )}
            </div>
            <div className="fields">
              <div className="field">
                <label htmlFor="o-name">称呼 Name</label>
                <input id="o-name" autoComplete="name" placeholder="例如：陈小姐" maxLength={40} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="o-contact">电话或微信号 Phone / WeChat</label>
                <input id="o-contact" autoComplete="tel" placeholder="方便我们联系你" maxLength={60} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="o-time">取餐时间 Pickup time</label>
                <select id="o-time" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })}>
                  {pickupSlots().map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="o-note">备注 Notes（可不填）</label>
                <textarea id="o-note" placeholder="例如：不要葱、多拿酱油" maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <div className="hp" aria-hidden="true">
                <label htmlFor="o-website">Website</label>
                <input id="o-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <div><button className="btn red" type="submit" disabled={sending}>{sending ? "提交中…" : `提交订单${total ? " · " + money(total) : ""}`}</button></div>
          </form>
        )}
      </section>

      {count > 0 && !placed && (
        <div className="cartbar">
          <div className="wrap">
            <div className="sum"><div className="count">已选 {count} 份</div><div className="total">{money(total)}</div></div>
            <a className="btn solid" href="#order">去下单</a>
          </div>
        </div>
      )}
    </>
  );
}
