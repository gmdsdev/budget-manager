CREATE TABLE "budget_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_id" uuid,
	"category_id" uuid NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"period_month" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"is_override" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"currency_code" text DEFAULT 'BRL' NOT NULL,
	"amount_cents" integer NOT NULL,
	"recurrence_type" "recurrence_type" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"installments" integer,
	"starts_on" text NOT NULL,
	"ends_on" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_periods" ADD CONSTRAINT "budget_periods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_periods" ADD CONSTRAINT "budget_periods_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_periods" ADD CONSTRAINT "budget_periods_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_periods_month_unique" ON "budget_periods" USING btree ("user_id","category_id","currency_code","period_month");--> statement-breakpoint
CREATE INDEX "budget_periods_user_month_idx" ON "budget_periods" USING btree ("user_id","period_month");--> statement-breakpoint
CREATE INDEX "budget_periods_budget_idx" ON "budget_periods" USING btree ("budget_id");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_category_currency_unique" ON "budgets" USING btree ("user_id","category_id","currency_code");--> statement-breakpoint
CREATE INDEX "budgets_user_id_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "budgets_category_idx" ON "budgets" USING btree ("category_id");