import { PAID_ACCESS_STATUSES, type SubscriptionStatus } from "./subscription.schema";

export type MirroredSubscription = {
  polarSubscriptionId: string | null;
  polarModifiedAt: Date | null;
  status: SubscriptionStatus | null;
};

export type IncomingSubscription = {
  polarSubscriptionId: string;
  polarModifiedAt: Date | null;
  status: SubscriptionStatus | null;
};

function grantsAccess(status: SubscriptionStatus | null): boolean {
  return status !== null && PAID_ACCESS_STATUSES.includes(status);
}

export function shouldApplyPolarSubscription(
  stored: MirroredSubscription | null,
  incoming: IncomingSubscription,
): boolean {
  if (!stored || stored.polarSubscriptionId === null) {
    return true;
  }

  if (stored.polarSubscriptionId !== incoming.polarSubscriptionId) {
    return grantsAccess(incoming.status) || !grantsAccess(stored.status);
  }

  if (stored.polarModifiedAt === null || incoming.polarModifiedAt === null) {
    return true;
  }

  return incoming.polarModifiedAt.getTime() >= stored.polarModifiedAt.getTime();
}
