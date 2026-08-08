import { toSubscriptionStatus } from "@budget-manager/schemas";

import type { Db } from "../index";
import { subscriptions } from "../schema/subscription";

export type PolarSubscriptionPayload = {
  id: string;
  status: string;
  productId?: string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  trialStart?: Date | string | null;
  trialEnd?: Date | string | null;
  customerId?: string | null;
  customer?: { id?: string | null; externalId?: string | null } | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function applyPolarSubscription({
  db,
  userId,
  payload,
}: {
  db: Db;
  userId: string;
  payload: PolarSubscriptionPayload;
}) {
  const values = {
    status: toSubscriptionStatus(payload.status),
    polarSubscriptionId: payload.id,
    polarCustomerId: payload.customer?.id ?? payload.customerId ?? null,
    polarProductId: payload.productId ?? null,
    currentPeriodEnd: toDate(payload.currentPeriodEnd),
    cancelAtPeriodEnd: payload.cancelAtPeriodEnd ?? false,
    trialStartsAt: toDate(payload.trialStart),
    trialEndsAt: toDate(payload.trialEnd),
  };

  const [row] = await db
    .insert(subscriptions)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: subscriptions.userId, set: values })
    .returning();

  return row ?? null;
}
