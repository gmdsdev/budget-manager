DROP INDEX "credit_card_bills_status_idx";--> statement-breakpoint
ALTER TABLE "credit_card_bills" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "credit_card_bills" DROP COLUMN "statement_total_cents";--> statement-breakpoint
ALTER TABLE "credit_card_bills" DROP COLUMN "paid_cents";--> statement-breakpoint
ALTER TABLE "credit_card_bills" DROP COLUMN "used_limit_cents";--> statement-breakpoint
DROP TYPE "public"."credit_card_bill_status";