CREATE TYPE "public"."category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."credit_card_bill_status" AS ENUM('open', 'waiting_payment', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_kind" AS ENUM('income', 'expense', 'transfer_in', 'transfer_out', 'credit_card_purchase', 'credit_card_payment');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('waiting_payment', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('fixed', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."wallet_type" AS ENUM('checking', 'savings', 'investments', 'cash');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "category_type" NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"limit_cents" integer NOT NULL,
	"close_day" smallint NOT NULL,
	"due_day" smallint NOT NULL,
	"default_billing_wallet_id" uuid,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_card_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credit_card_id" uuid NOT NULL,
	"billing_wallet_id" uuid,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"close_at" date NOT NULL,
	"due_at" date NOT NULL,
	"status" "credit_card_bill_status" DEFAULT 'open' NOT NULL,
	"statement_total_cents" integer DEFAULT 0 NOT NULL,
	"paid_cents" integer DEFAULT 0 NOT NULL,
	"used_limit_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "transaction_kind" NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"category_id" uuid,
	"default_account_id" uuid,
	"default_credit_card_id" uuid,
	"default_billing_wallet_id" uuid,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"kind" "transaction_kind" NOT NULL,
	"status" "transaction_status" DEFAULT 'waiting_payment' NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"occurrence_date" date NOT NULL,
	"category_id" uuid,
	"wallet_id" uuid,
	"credit_card_id" uuid,
	"credit_card_bill_id" uuid,
	"notes" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"recurrence_type" "recurrence_type" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"installments" integer,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "wallet_type" NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"opening_balance_cents" integer DEFAULT 0 NOT NULL,
	"current_balance_cents" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_default_billing_wallet_id_wallets_id_fk" FOREIGN KEY ("default_billing_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_bills" ADD CONSTRAINT "credit_card_bills_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_bills" ADD CONSTRAINT "credit_card_bills_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_bills" ADD CONSTRAINT "credit_card_bills_billing_wallet_id_wallets_id_fk" FOREIGN KEY ("billing_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_default_account_id_wallets_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_default_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("default_credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_templates" ADD CONSTRAINT "transaction_templates_default_billing_wallet_id_wallets_id_fk" FOREIGN KEY ("default_billing_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_template_id_transaction_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."transaction_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_occurrences" ADD CONSTRAINT "transaction_occurrences_credit_card_bill_id_credit_card_bills_id_fk" FOREIGN KEY ("credit_card_bill_id") REFERENCES "public"."credit_card_bills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_template_id_transaction_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."transaction_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_bills_unique_cycle" ON "credit_card_bills" USING btree ("credit_card_id","period_start","period_end");--> statement-breakpoint
CREATE INDEX "credit_card_bills_card_idx" ON "credit_card_bills" USING btree ("credit_card_id");--> statement-breakpoint
CREATE INDEX "credit_card_bills_status_idx" ON "credit_card_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_wallet_idx" ON "transaction_occurrences" USING btree ("wallet_id","occurrence_date");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_card_idx" ON "transaction_occurrences" USING btree ("credit_card_id","occurrence_date");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_bill_idx" ON "transaction_occurrences" USING btree ("credit_card_bill_id");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_template_idx" ON "transaction_occurrences" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_status_idx" ON "transaction_occurrences" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "recurrence_rules_template_unique" ON "recurrence_rules" USING btree ("template_id");