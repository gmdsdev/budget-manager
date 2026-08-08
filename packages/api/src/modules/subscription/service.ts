import { isBillingConfigured } from "@budget-manager/env/server";
import { TRIAL_DAYS } from "@budget-manager/schemas";

import { SubscriptionRequiredError } from "../../errors";
import {
  deriveSubscriptionAccess,
  type SubscriptionAccess,
  UNMANAGED,
} from "./access";
import type { SubscriptionRepository } from "./repository";

export type SubscriptionStatusView = Omit<
  SubscriptionAccess,
  "trialEndsAt" | "currentPeriodEnd"
> & {
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  trialDays: number;
  billingEnabled: boolean;
};

export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async getAccess({ userId }: { userId: string }): Promise<SubscriptionAccess> {
    const row = await this.repository.findByUserId(userId);

    if (!row && !isBillingConfigured) {
      return UNMANAGED;
    }

    return deriveSubscriptionAccess(row, new Date());
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
      trialEndsAt: access.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: access.currentPeriodEnd?.toISOString() ?? null,
      trialDays: TRIAL_DAYS,
      billingEnabled: isBillingConfigured,
    };
  }
}
