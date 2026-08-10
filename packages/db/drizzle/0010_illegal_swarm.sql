ALTER TABLE "user" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Hand-added, like migration 0006: accounts that predate onboarding have
-- already set themselves up, so the flow must never be shown to them.
UPDATE "user" SET "onboarding_completed" = true;
