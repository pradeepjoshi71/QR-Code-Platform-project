import { SubscriptionStatus } from '@prisma/client';

export interface PlanLimitsConfig {
  maxQrCodes: number | null; // null = unlimited
}

// Plan limits definition keyed by SubscriptionStatus enum
// PAST_DUE and CANCELED are treated the same as FREE for gating purposes
export const PLAN_LIMITS: Record<SubscriptionStatus, PlanLimitsConfig> = {
  FREE: { maxQrCodes: 5 },
  ACTIVE: { maxQrCodes: null },
  PAST_DUE: { maxQrCodes: 5 },
  CANCELED: { maxQrCodes: 5 },
};

/**
 * Returns the plan limits config for a given subscription status.
 * Defaults to FREE limits if status is missing or unverified.
 */
export function getPlanLimits(status?: SubscriptionStatus | null): PlanLimitsConfig {
  if (!status || !(status in PLAN_LIMITS)) {
    return PLAN_LIMITS.FREE;
  }
  return PLAN_LIMITS[status];
}
