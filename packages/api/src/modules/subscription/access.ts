import {
  DAY_MS,
  PAID_ACCESS_STATUSES,
  SubscriptionAccessState,
  SubscriptionStatus,
} from "@budget-manager/schemas";

export type SubscriptionRow = {
  trialEndsAt: Date;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
};

export type SubscriptionAccess = {
  state: SubscriptionAccessState;
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  trialEndsAt: Date;
  trialDaysRemaining: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export function deriveSubscriptionAccess(
  row: SubscriptionRow,
  now: Date,
): SubscriptionAccess {
  const paid =
    row.status !== null &&
    PAID_ACCESS_STATUSES.includes(row.status) &&
    (row.currentPeriodEnd === null ||
      row.currentPeriodEnd.getTime() > now.getTime());

  const trialing = row.trialEndsAt.getTime() > now.getTime();

  const state = paid
    ? row.status === SubscriptionStatus.PAST_DUE
      ? SubscriptionAccessState.PAST_DUE
      : SubscriptionAccessState.ACTIVE
    : trialing
      ? SubscriptionAccessState.TRIALING
      : SubscriptionAccessState.EXPIRED;

  return {
    state,
    hasAccess: state !== SubscriptionAccessState.EXPIRED,
    status: row.status,
    trialEndsAt: row.trialEndsAt,
    trialDaysRemaining: Math.max(
      0,
      Math.floor((row.trialEndsAt.getTime() - now.getTime()) / DAY_MS),
    ),
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}
