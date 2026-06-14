import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function planFromPriceId(priceId: string): "pro" | "team" | "free" {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return "pro";
  if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return "pro";
  if (priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY) return "team";
  return "free";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const subId = session.subscription as string;
      if (!userId || !subId) break;

      const sub = await stripe.subscriptions.retrieve(subId);
      const plan = planFromPriceId(sub.items.data[0].price.id);

      await supabaseAdmin
        .from("profiles")
        .update({ plan, stripe_subscription_id: subId })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      const plan = planFromPriceId(sub.items.data[0].price.id);
      const active = sub.status === "active" || sub.status === "trialing";

      await supabaseAdmin
        .from("profiles")
        .update({
          plan: active ? plan : "free",
          stripe_subscription_id: sub.id,
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;

      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

