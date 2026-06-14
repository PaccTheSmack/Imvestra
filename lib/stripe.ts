import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
