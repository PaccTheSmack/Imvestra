import type { Plan } from "@/types";

export const PLAN_GATES = {
  // Saving
  save_property: ["investor", "manager", "team"] as Plan[],

  // Portfolio
  portfolio: ["investor", "manager", "team"] as Plan[],

  // PDF
  pdf_export: ["investor", "manager", "team"] as Plan[],

  // Standort unlimited
  standort_unlimited: ["investor", "manager", "team"] as Plan[],

  // Mietverwaltung
  tenants: ["investor", "manager", "team"] as Plan[],

  // Steuer
  steuer: ["investor", "manager", "team"] as Plan[],

  // Finanzen Hub
  finanzen: ["manager", "team"] as Plan[],

  // Smart Tasks
  smart_tasks: ["manager", "team"] as Plan[],

  // Szenario
  szenarien: ["manager", "team"] as Plan[],

  // Team features
  team_features: ["team"] as Plan[],

  // Property limits
  properties_10: ["investor"] as Plan[],
  properties_unlimited: ["manager", "team"] as Plan[],
} as const;

export function canAccess(feature: keyof typeof PLAN_GATES, plan: Plan): boolean {
  return (PLAN_GATES[feature] as readonly Plan[]).includes(plan);
}

export function getPropertyLimit(plan: Plan): number | "unlimited" {
  if (plan === "free") return 1;
  if (plan === "investor") return 10;
  return "unlimited";
}

export function getTenantLimit(plan: Plan): number | "unlimited" {
  if (plan === "free") return 0;
  if (plan === "investor") return 10;
  return "unlimited";
}
