export enum SubscriptionStatus {
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  CANCELED = "canceled",
  UNPAID = "unpaid",
}

export const SUBSCRIPTION_STATUSES = Object.values(SubscriptionStatus);

export enum SubscriptionAccessState {
  TRIALING = "trialing",
  ACTIVE = "active",
  PAST_DUE = "past_due",
  EXPIRED = "expired",
}

export const TRIAL_DAYS = 14;

export const DAY_MS = 24 * 60 * 60 * 1000;

export const PAID_ACCESS_STATUSES: readonly SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
];

export function isSubscriptionStatus(
  value: string,
): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as string[]).includes(value);
}

export function toSubscriptionStatus(
  value: string | null | undefined,
): SubscriptionStatus | null {
  return value && isSubscriptionStatus(value) ? value : null;
}

export function trialEndsAtFrom(startedAt: Date): Date {
  return new Date(startedAt.getTime() + TRIAL_DAYS * DAY_MS);
}
