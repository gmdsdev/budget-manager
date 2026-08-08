import {
  SubscriptionAccessState,
  type SubscriptionStatus,
} from "@budget-manager/schemas";

export type SubscriptionStatusRow = {
  state: SubscriptionAccessState;
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number;
  trialDays: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingEnabled: boolean;
};

export const TRIAL_WARNING_DAYS = 5;

export type SubscriptionCopy =
  | { kind: "start"; days: number }
  | { kind: "trialing"; endsAt: string | null }
  | { kind: "active"; endsAt: string | null; ending: boolean }
  | { kind: "pastDue" }
  | { kind: "expired" }
  | { kind: "unmanaged" };

export type SubscriptionAction = "start" | "subscribe" | "updatePayment" | "manage";

export function subscriptionCopy(status: SubscriptionStatusRow): SubscriptionCopy {
  switch (status.state) {
    case SubscriptionAccessState.NONE:
      return { kind: "start", days: status.trialDays };
    case SubscriptionAccessState.TRIALING:
      return { kind: "trialing", endsAt: status.trialEndsAt };
    case SubscriptionAccessState.PAST_DUE:
      return { kind: "pastDue" };
    case SubscriptionAccessState.EXPIRED:
      return { kind: "expired" };
    case SubscriptionAccessState.UNMANAGED:
      return { kind: "unmanaged" };
    default:
      return {
        kind: "active",
        endsAt: status.currentPeriodEnd,
        ending: status.cancelAtPeriodEnd,
      };
  }
}

export function subscriptionAction(
  status: SubscriptionStatusRow,
): SubscriptionAction {
  switch (status.state) {
    case SubscriptionAccessState.NONE:
      return "start";
    case SubscriptionAccessState.EXPIRED:
      return "subscribe";
    case SubscriptionAccessState.PAST_DUE:
      return "updatePayment";
    default:
      return "manage";
  }
}

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
