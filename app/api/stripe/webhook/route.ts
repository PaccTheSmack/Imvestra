import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subId = session.subscription as string;

        if (!userId || !subId) {
          console.error("Missing userId or subId in session metadata");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subId);
        const priceId = sub.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan,
            stripe_subscription_id: subId,
          })
          .eq("id", userId);

        if (error) console.error("Supabase update error:", error);
        else console.log(`User ${userId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;

        if (!userId) {
          // Try to find user by customer ID
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", sub.customer as string)
            .single();

          if (!profile) break;

          const priceId = sub.items.data[0]?.price.id;
          const plan = planFromPriceId(priceId);
          const active = ["active", "trialing"].includes(sub.status);

          await supabaseAdmin
            .from("profiles")
            .update({
              plan: active ? plan : "free",
              stripe_subscription_id: sub.id,
            })
            .eq("id", profile.id);
          break;
        }

        const priceId = sub.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);
        const active = ["active", "trialing"].includes(sub.status);

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
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;

        if (userId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: "free",
              stripe_subscription_id: null,
            })
            .eq("id", userId);
        } else {
          // Fallback: find by customer ID
          await supabaseAdmin
            .from("profiles")
            .update({
              plan: "free",
              stripe_subscription_id: null,
            })
            .eq("stripe_customer_id", sub.customer as string);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for customer:", invoice.customer);
        // Could send email notification here
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
