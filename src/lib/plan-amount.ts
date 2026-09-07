import { PLAN_CONFIGS, type PlanTier } from "@/lib/plan-limits";

const PAID_TIERS: PlanTier[] = ["pro", "max", "ultra", "ultra_x20"];

/** True when MercadoPago charged at least 90% of the catalog price for that tier. */
export function amountMatchesPlan(tier: PlanTier, amount: unknown): boolean {
  if (!PAID_TIERS.includes(tier)) return false;
  const expected = PLAN_CONFIGS[tier]?.price;
  const paid = typeof amount === "number" ? amount : Number(amount);
  if (!expected || !Number.isFinite(paid)) return false;
  return paid + 1e-6 >= expected * 0.9;
}

export function cheapestTierForAmount(amount: unknown): PlanTier | null {
  const paid = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(paid) || paid <= 0) return null;
  let best: PlanTier | null = null;
  for (const tier of PAID_TIERS) {
    const price = PLAN_CONFIGS[tier]?.price ?? 0;
    if (price > 0 && paid + 1e-6 >= price * 0.9) best = tier;
  }
  return best;
}
