import Stripe from "stripe";
import type { Plan } from "@/types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith("your_")) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return _stripe;
}

// Named export for convenience — lazy getter so build never fails on missing key
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type PlanKey =
  | "investor_monthly"
  | "investor_yearly"
  | "manager_monthly"
  | "manager_yearly"
  | "team_monthly"
  | "team_yearly";

export const STRIPE_PLANS: Record<
  PlanKey,
  {
    priceId: string;
    plan: Plan;
    name: string;
    price: number;
    interval: "month" | "year";
  }
> = {
  investor_monthly: {
    priceId: process.env.STRIPE_PRICE_INVESTOR_MONTHLY!,
    plan: "investor",
    name: "Investor Monthly",
    price: 19.99,
    interval: "month",
  },
  investor_yearly: {
    priceId: process.env.STRIPE_PRICE_INVESTOR_YEARLY!,
    plan: "investor",
    name: "Investor Yearly",
    price: 159,
    interval: "year",
  },
  manager_monthly: {
    priceId: process.env.STRIPE_PRICE_MANAGER_MONTHLY!,
    plan: "manager",
    name: "Manager Monthly",
    price: 49.99,
    interval: "month",
  },
  manager_yearly: {
    priceId: process.env.STRIPE_PRICE_MANAGER_YEARLY!,
    plan: "manager",
    name: "Manager Yearly",
    price: 399,
    interval: "year",
  },
  team_monthly: {
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY!,
    plan: "team",
    name: "Team Monthly",
    price: 99.99,
    interval: "month",
  },
  team_yearly: {
    priceId: process.env.STRIPE_PRICE_TEAM_YEARLY!,
    plan: "team",
    name: "Team Yearly",
    price: 799,
    interval: "year",
  },
};

export function planFromPriceId(priceId: string): Plan {
  const entry = Object.values(STRIPE_PLANS).find((p) => p.priceId === priceId);
  return entry?.plan ?? "free";
}
