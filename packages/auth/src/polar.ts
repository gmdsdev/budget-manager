import type { Db } from "@budget-manager/db";
import {
  applyPolarSubscription,
  type PolarSubscriptionPayload,
} from "@budget-manager/db/subscription/store";
import { env } from "@budget-manager/env/server";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

export const SUBSCRIPTION_SLUG = "subscription";

function billingUrl() {
  return new URL("/billing", env.CORS_ORIGIN).toString();
}

async function sync(db: Db, payload: { data: PolarSubscriptionPayload }) {
  const userId = payload.data.customer?.externalId;

  if (!userId) {
    console.error(
      `Polar subscription ${payload.data.id} carried no external customer id`,
    );
    return;
  }

  await applyPolarSubscription({ db, userId, payload: payload.data });
}

export function polarPlugin(db: Db) {
  const accessToken = env.POLAR_ACCESS_TOKEN;
  const webhookSecret = env.POLAR_WEBHOOK_SECRET;
  const productId = env.POLAR_PRODUCT_ID;

  if (!accessToken || !webhookSecret || !productId) {
    return null;
  }

  return polar({
    client: new Polar({ accessToken, server: env.POLAR_SERVER }),
    createCustomerOnSignUp: true,
    use: [
      checkout({
        products: [{ productId, slug: SUBSCRIPTION_SLUG }],
        successUrl: billingUrl(),
        returnUrl: billingUrl(),
        authenticatedUsersOnly: true,
      }),
      portal({ returnUrl: billingUrl() }),
      webhooks({
        secret: webhookSecret,
        onSubscriptionCreated: (payload) => sync(db, payload),
        onSubscriptionActive: (payload) => sync(db, payload),
        onSubscriptionUpdated: (payload) => sync(db, payload),
        onSubscriptionCanceled: (payload) => sync(db, payload),
        onSubscriptionUncanceled: (payload) => sync(db, payload),
        onSubscriptionRevoked: (payload) => sync(db, payload),
      }),
    ],
  });
}
