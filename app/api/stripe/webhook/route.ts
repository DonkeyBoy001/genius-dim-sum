import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordCheckout, stripe } from "@/lib/stripe";

// Stripe calls this when a payment completes. Set it up in Stripe →
// Developers → Webhooks, with the signing secret in STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "not configured" }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await recordCheckout(event.data.object);
    } catch (err) {
      console.error("webhook: recording payment failed", err);
      // A non-2xx makes Stripe retry later.
      return NextResponse.json({ error: "retry" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
