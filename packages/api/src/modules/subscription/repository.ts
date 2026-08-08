import type { Db } from "@budget-manager/db";
import { user } from "@budget-manager/db/schema/auth";
import { subscriptions } from "@budget-manager/db/schema/subscription";
import { ensureTrialSubscription } from "@budget-manager/db/subscription/store";
import { toSubscriptionStatus } from "@budget-manager/schemas";
import { eq } from "drizzle-orm";

import type { SubscriptionRow } from "./access";

const SUBSCRIPTION_PUBLIC_COLUMNS = {
  trialEndsAt: subscriptions.trialEndsAt,
  status: subscriptions.status,
  currentPeriodEnd: subscriptions.currentPeriodEnd,
  cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
  polarCustomerId: subscriptions.polarCustomerId,
  polarSubscriptionId: subscriptions.polarSubscriptionId,
} as const;

function toDomainRow(row: {
  trialEndsAt: Date;
  status: string | null;
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

  async startTrial(userId: string): Promise<SubscriptionRow | null> {
    const [owner] = await this.db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!owner) {
      return null;
    }

    await ensureTrialSubscription({
      db: this.db,
      userId,
      startedAt: owner.createdAt,
    });

    return await this.findByUserId(userId);
  }
}
