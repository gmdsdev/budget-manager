import {
  SubscriptionAccessState,
  type SubscriptionStatus,
} from "@budget-manager/schemas";

export type SubscriptionStatusRow = {
  state: SubscriptionAccessState;
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  trialEndsAt: string;
  trialDaysRemaining: number;
  trialDays: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingEnabled: boolean;
};

export const TRIAL_WARNING_DAYS = 5;

export function subscriptionNeedsAttention(
  status: SubscriptionStatusRow | undefined,
): boolean {
  if (!status?.hasAccess) {
    return false;
  }

  if (status.state === SubscriptionAccessState.PAST_DUE) {
    return true;
  }

  if (status.state === SubscriptionAccessState.TRIALING) {
    return status.trialDaysRemaining <= TRIAL_WARNING_DAYS;
  }

  return status.cancelAtPeriodEnd;
}
