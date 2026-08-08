import { toSubscriptionStatus, trialEndsAtFrom } from "@budget-manager/schemas";
import { eq } from "drizzle-orm";

import type { Db } from "../index";
import { subscriptions } from "../schema/subscription";

export type PolarSubscriptionPayload = {
  id: string;
  status: string;
  productId?: string | null;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  customerId?: string | null;
  customer?: { id?: string | null; externalId?: string | null } | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function ensureTrialSubscription({
  db,
  userId,
  startedAt,
}: {
  db: Db;
  userId: string;
  startedAt: Date;
}) {
  const [row] = await db
    .insert(subscriptions)
    .values({ userId, trialEndsAt: trialEndsAtFrom(startedAt) })
    .onConflictDoNothing({ target: subscriptions.userId })
    .returning();

  return row ?? null;
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
  };

  const updated = await db
    .update(subscriptions)
    .set(values)
    .where(eq(subscriptions.userId, userId))
    .returning();

  if (updated.length > 0) {
    return updated[0] ?? null;
  }

  const [inserted] = await db
    .insert(subscriptions)
    .values({ userId, trialEndsAt: new Date(), ...values })
    .onConflictDoUpdate({ target: subscriptions.userId, set: values })
    .returning();

  return inserted ?? null;
}
