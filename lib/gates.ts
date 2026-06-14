import type { Plan } from "@/types";

export const GATES = {
  save_property:  ["pro", "team"] as Plan[],
  portfolio:      ["pro", "team"] as Plan[],
  pdf_export:     ["pro", "team"] as Plan[],
  unlimited_calc: ["pro", "team"] as Plan[],
} as const;

export function canAccess(feature: keyof typeof GATES, plan: Plan): boolean {
  return (GATES[feature] as readonly Plan[]).includes(plan);
}
