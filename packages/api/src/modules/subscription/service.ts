import { isBillingConfigured } from "@budget-manager/env/server";
import { SubscriptionAccessState, TRIAL_DAYS } from "@budget-manager/schemas";

import { SubscriptionRequiredError } from "../../errors";
import { deriveSubscriptionAccess, type SubscriptionAccess } from "./access";
import type { SubscriptionRepository } from "./repository";

export type SubscriptionStatusView = Omit<
  SubscriptionAccess,
  "trialEndsAt" | "currentPeriodEnd"
> & {
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  trialDays: number;
  billingEnabled: boolean;
};

const NO_ACCESS: SubscriptionAccess = {
  state: SubscriptionAccessState.EXPIRED,
  hasAccess: false,
  status: null,
  trialEndsAt: new Date(0),
  trialDaysRemaining: 0,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async getAccess({ userId }: { userId: string }): Promise<SubscriptionAccess> {
    const row =
      (await this.repository.findByUserId(userId)) ??
      (await this.repository.startTrial(userId));

    return row ? deriveSubscriptionAccess(row, new Date()) : NO_ACCESS;
  }

  async requireAccess({
    userId,
  }: {
    userId: string;
  }): Promise<SubscriptionAccess> {
    const access = await this.getAccess({ userId });

    if (!access.hasAccess) {
      throw new SubscriptionRequiredError("subscription.error.required");
    }

    return access;
  }

  async getStatus({
    userId,
  }: {
    userId: string;
  }): Promise<SubscriptionStatusView> {
    const access = await this.getAccess({ userId });

    return {
      ...access,
      trialEndsAt: access.trialEndsAt.toISOString(),
      currentPeriodEnd: access.currentPeriodEnd?.toISOString() ?? null,
      trialDays: TRIAL_DAYS,
      billingEnabled: isBillingConfigured,
    };
  }
}
