import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("your_")) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Keep named export for backwards compat — lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    name: "Pro",
    price: 19,
    interval: "month" as const,
  },
  pro_yearly: {
    priceId: process.env.STRIPE_PRICE_PRO_YEARLY!,
    name: "Pro",
    price: 149,
    interval: "year" as const,
  },
  team_monthly: {
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
    name: "Team",
    price: 49,
    interval: "month" as const,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
