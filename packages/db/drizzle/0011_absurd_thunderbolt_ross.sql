ALTER TABLE "subscriptions" ALTER COLUMN "trial_ends_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_starts_at" timestamp;--> statement-breakpoint
DELETE FROM "subscriptions" WHERE "polar_subscription_id" IS NULL;