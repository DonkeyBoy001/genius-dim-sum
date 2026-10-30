"use client";

import { useCallback, useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase";
import { money, type Order, type OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = { new: "待付款", paid: "已付款", picked_up: "已取餐", cancelled: "已取消" };

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const { data, error } = await browserClient()
      .from("orders")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) setError("订单读取失败，请刷新页面。");
    else setOrders(data as Order[]);
  }, []);

  useEffect(() => {
    load();
    const sb = browserClient();
    const ch = sb
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => {
      sb.removeChannel(ch);
      clearInterval(t);
    };
  }, [load]);

  const pending = orders.filter((o) => o.status === "new" || o.status === "paid");
  useEffect(() => {
    document.title = pending.length ? `(${pending.length}) 天才港点 后台` : "天才港点 后台";
  }, [pending.length]);

  async function setStatus(o: Order, status: OrderStatus) {
    setConfirmCancel(null);
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const { error } = await browserClient().from("orders").update({ status }).eq("id", o.id);
    if (error) {
      setError(`${o.code} 状态没保存成功，请重试。`);
      load();
    }
  }

  const shown = showDone ? orders : pending;
  const paidTotal = orders.filter((o) => o.status === "paid" || o.status === "picked_up").reduce((a, o) => a + o.total_cents, 0);

  return (
    <section>
      <div className="toolbar">
        <span>待处理 {pending.length} 单 · 近 36 小时已收款 {money(paidTotal)}</span>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="toggle" aria-pressed={showDone} onClick={() => setShowDone((v) => !v)}>显示已完成</button>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      {shown.length === 0 ? (
        <div className="notice">还没有{showDone ? "" : "待处理的"}订单。顾客在网站下单后会自动出现在这里，不用刷新。</div>
      ) : (
        <div className="orders">
          {shown.map((o) => (
            <article className={`ocard ${o.status}`} key={o.id}>
              <div className="top">
                <span className="ocode">{o.code}</span>
                <span className={`pill ${o.status}`}>{STATUS_LABEL[o.status]}</span>
                {o.paid_via === "stripe" && <span className="pill online">在线已付</span>}
                <span className="meta">
                  {new Date(o.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" })} 下单 · 取餐 {o.pickup_time}
                </span>
              </div>
              <div><strong>{o.customer_name}</strong> · <span className="meta">{o.contact}</span></div>
              <div className="lines">
                {o.items.map((l) => (
                  <div className="line" key={l.id}><span>{l.name_zh} × {l.qty}</span><span>{money(l.price_cents * l.qty)}</span></div>
                ))}
                <div className="line total"><span>合计</span><span>{money(o.total_cents)}</span></div>
              </div>
              {o.note && <div className="meta">备注：{o.note}</div>}
              {o.paid_via === "stripe" && o.status === "cancelled" && (
                <div className="err">这单已在线付款，取消后记得去 Stripe 后台退款。</div>
              )}
              <div className="actions">
                {o.status === "new" && <button className="btn small red" onClick={() => setStatus(o, "paid")}>确认已付款</button>}
                {(o.status === "new" || o.status === "paid") && (
                  <button className="btn small outline" onClick={() => setStatus(o, "picked_up")}>已取餐</button>
                )}
                {(o.status === "new" || o.status === "paid") &&
                  (confirmCancel === o.id ? (
                    <span className="confirm">
                      确定取消？
                      <button className="btn small red" onClick={() => setStatus(o, "cancelled")}>取消订单</button>
                      <button className="btn small outline" onClick={() => setConfirmCancel(null)}>不取消</button>
                    </span>
                  ) : (
                    <button className="btn small outline" onClick={() => setConfirmCancel(o.id)}>取消</button>
                  ))}
                {(o.status === "picked_up" || o.status === "cancelled") && (
                  <button className="btn small outline" onClick={() => setStatus(o, "paid")}>撤回</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
