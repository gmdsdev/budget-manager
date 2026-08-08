import type { Db } from "@budget-manager/db";
import { subscriptions } from "@budget-manager/db/schema/subscription";
import { toSubscriptionStatus } from "@budget-manager/schemas";
import { eq } from "drizzle-orm";

import type { SubscriptionRow } from "./access";

const SUBSCRIPTION_PUBLIC_COLUMNS = {
  status: subscriptions.status,
  trialStartsAt: subscriptions.trialStartsAt,
  trialEndsAt: subscriptions.trialEndsAt,
  currentPeriodEnd: subscriptions.currentPeriodEnd,
  cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
  polarCustomerId: subscriptions.polarCustomerId,
  polarSubscriptionId: subscriptions.polarSubscriptionId,
} as const;

function toDomainRow(row: {
  status: string | null;
  trialStartsAt: Date | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
}): SubscriptionRow {
  return { ...row, status: toSubscriptionStatus(row.status) };
}

export class SubscriptionRepository {
  constructor(private readonly db: Db) {}

  async findByUserId(userId: string): Promise<SubscriptionRow | null> {
    const [row] = await this.db
      .select(SUBSCRIPTION_PUBLIC_COLUMNS)
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return row ? toDomainRow(row) : null;
  }
}
