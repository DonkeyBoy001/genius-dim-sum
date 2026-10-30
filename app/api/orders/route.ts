import { NextResponse } from "next/server";
import { getMenu } from "@/lib/menu";
import { orderCode, priceOrder, type OrderInput } from "@/lib/order";
import { pickupSlots } from "@/lib/site";
import { serviceClient, supabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "网上点单还没开通，请私聊小月下单。" }, { status: 503 });
  }

  let body: OrderInput & { website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "订单格式不对，请刷新页面再试。" }, { status: 400 });
  }
  // Honeypot field that people never see; bots tend to fill it.
  if (typeof body.website === "string" && body.website) {
    return NextResponse.json({ error: "提交失败，请刷新页面再试。" }, { status: 400 });
  }

  const { menu, live } = await getMenu();
  if (!live) return NextResponse.json({ error: "菜单暂时读不到，请稍后再试或私聊小月。" }, { status: 503 });

  const priced = priceOrder(body, menu, pickupSlots());
  if ("error" in priced) return NextResponse.json({ error: priced.error }, { status: 400 });

  const db = serviceClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = orderCode();
    const { error } = await db.from("orders").insert({ ...priced, code });
    if (!error) return NextResponse.json({ code, total_cents: priced.total_cents, items: priced.items });
    if (error.code !== "23505") {
      console.error("order insert failed", error);
      break;
    }
  }
  return NextResponse.json({ error: "下单没成功，请再试一次或私聊小月。" }, { status: 500 });
}
