import { NextResponse } from "next/server";
import { checkoutLineItems } from "@/lib/checkout";
import { recordCheckout, stripe, stripeConfigured } from "@/lib/stripe";
import { serviceClient, supabaseConfigured } from "@/lib/supabase";
import type { Order } from "@/lib/types";

const notReady = () => NextResponse.json({ error: "在线付款还没开通，请扫码付款。" }, { status: 503 });

// Starts Stripe Checkout for an order the customer just placed.
export async function POST(req: Request) {
  if (!stripeConfigured || !supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return notReady();

  let code = "";
  try {
    const body = await req.json();
    code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  } catch {}
  if (!/^TC[A-Z0-9]{4}$/.test(code)) return NextResponse.json({ error: "订单号不对，请刷新页面。" }, { status: 400 });

  const db = serviceClient();
  const { data: order } = await db.from("orders").select("*").eq("code", code).maybeSingle<Order>();
  if (!order) return NextResponse.json({ error: "找不到这个订单，请重新下单。" }, { status: 404 });
  if (order.paid_via === "stripe" || order.status === "paid" || order.status === "picked_up") {
    return NextResponse.json({ error: "这单已经付过款了，不用再付。" }, { status: 409 });
  }
  if (order.status === "cancelled") return NextResponse.json({ error: "这单已取消，请重新下单。" }, { status: 409 });

  try {
    // Tapping the button twice reuses the same payment page, so nobody pays twice.
    if (order.stripe_session_id) {
      const existing = await stripe().checkout.sessions.retrieve(order.stripe_session_id);
      if (existing.status === "open" && existing.url) return NextResponse.json({ url: existing.url });
    }

    const origin = new URL(req.url).origin;
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: checkoutLineItems(order),
      client_reference_id: order.id,
      metadata: { order_id: order.id, code: order.code },
      payment_intent_data: { description: `天才港点 ${order.code}`, metadata: { order_id: order.id, code: order.code } },
      success_url: `${origin}/?paid={CHECKOUT_SESSION_ID}#order`,
      cancel_url: `${origin}/?unpaid=${order.code}#order`,
      // Stripe's shortest allowed expiry; an unpaid order shouldn't stay payable all day.
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      locale: "auto",
    });
    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout create failed", err);
    return NextResponse.json({ error: "在线付款暂时打不开，请扫码付款或稍后再试。" }, { status: 502 });
  }
}

// Called when the customer comes back from Stripe, to show whether the
// payment went through. Also records it, in case the webhook is slow.
export async function GET(req: Request) {
  if (!stripeConfigured || !supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return notReady();
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return NextResponse.json({ error: "付款信息不对。" }, { status: 400 });
  try {
    const session = await stripe().checkout.sessions.retrieve(id);
    const order = await recordCheckout(session);
    if (!order) return NextResponse.json({ paid: false, code: session.metadata?.code ?? "" });
    return NextResponse.json({ paid: true, code: order.code, total_cents: order.total_cents, items: order.items });
  } catch (err) {
    console.error("checkout lookup failed", err);
    return NextResponse.json({ error: "暂时查不到付款结果，请私聊小月确认。" }, { status: 502 });
  }
}
