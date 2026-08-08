import {
  DAY_MS,
  PAID_ACCESS_STATUSES,
  SubscriptionAccessState,
  SubscriptionStatus,
} from "@budget-manager/schemas";

export type SubscriptionRow = {
  status: SubscriptionStatus | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
};

export type SubscriptionAccess = {
  state: SubscriptionAccessState;
  hasAccess: boolean;
  status: SubscriptionStatus | null;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

const NONE: SubscriptionAccess = {
  state: SubscriptionAccessState.NONE,
  hasAccess: false,
  status: null,
  trialEndsAt: null,
  trialDaysRemaining: 0,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export const UNMANAGED: SubscriptionAccess = {
  ...NONE,
  state: SubscriptionAccessState.UNMANAGED,
  hasAccess: true,
};

function stateFor(row: SubscriptionRow, now: Date): SubscriptionAccessState {
  if (row.status === null || !PAID_ACCESS_STATUSES.includes(row.status)) {
    return SubscriptionAccessState.EXPIRED;
  }

  if (
    row.currentPeriodEnd !== null &&
    row.currentPeriodEnd.getTime() <= now.getTime()
  ) {
    return SubscriptionAccessState.EXPIRED;
  }

  if (row.status === SubscriptionStatus.TRIALING) {
    return row.trialEndsAt !== null &&
      row.trialEndsAt.getTime() <= now.getTime()
      ? SubscriptionAccessState.EXPIRED
      : SubscriptionAccessState.TRIALING;
  }

  return row.status === SubscriptionStatus.PAST_DUE
    ? SubscriptionAccessState.PAST_DUE
    : SubscriptionAccessState.ACTIVE;
}

export function deriveSubscriptionAccess(
  row: SubscriptionRow | null,
  now: Date,
): SubscriptionAccess {
  if (!row) {
    return NONE;
  }

  const state = stateFor(row, now);

  return {
    state,
    hasAccess: state !== SubscriptionAccessState.EXPIRED,
    status: row.status,
    trialEndsAt: row.trialEndsAt,
    trialDaysRemaining:
      state === SubscriptionAccessState.TRIALING && row.trialEndsAt
        ? Math.max(
            0,
            Math.floor((row.trialEndsAt.getTime() - now.getTime()) / DAY_MS),
          )
        : 0,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}
