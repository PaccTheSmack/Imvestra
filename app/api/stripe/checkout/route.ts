import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PLANS, PlanKey } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const body = await request.json();
    const { planKey } = body as { planKey: PlanKey };

    if (!planKey || !STRIPE_PLANS[planKey]) {
      return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });
    }

    const plan = STRIPE_PLANS[planKey];

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email!,
        name: profile?.name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Check for existing subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // If active sub exists → redirect to portal
    if (existingSubs.data.length > 0) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true&plan=${plan.plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
      metadata: {
        supabase_user_id: user.id,
        plan_key: planKey,
      },
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          supabase_user_id: user.id,
          plan_key: planKey,
        },
      },
      locale: "de",
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout Session konnte nicht erstellt werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
