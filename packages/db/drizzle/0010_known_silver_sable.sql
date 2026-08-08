CREATE TYPE "public"."subscription_status" AS ENUM('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trial_ends_at" timestamp NOT NULL,
	"status" "subscription_status",
	"polar_customer_id" text,
	"polar_subscription_id" text,
	"polar_product_id" text,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_polar_customer_id_idx" ON "subscriptions" USING btree ("polar_customer_id");--> statement-breakpoint
INSERT INTO "subscriptions" ("user_id", "trial_ends_at", "created_at", "updated_at")
SELECT "id", "created_at" + INTERVAL '14 days', now(), now() FROM "user"
ON CONFLICT ("user_id") DO NOTHING;