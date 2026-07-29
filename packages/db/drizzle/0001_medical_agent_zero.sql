ALTER TABLE "todo" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "todo" CASCADE;--> statement-breakpoint
CREATE INDEX "categories_user_id_type_idx" ON "categories" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "credit_cards_user_id_idx" ON "credit_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_cards_billing_wallet_idx" ON "credit_cards" USING btree ("default_billing_wallet_id");--> statement-breakpoint
CREATE INDEX "credit_card_bills_user_id_idx" ON "credit_card_bills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_card_bills_billing_wallet_idx" ON "credit_card_bills" USING btree ("billing_wallet_id");--> statement-breakpoint
CREATE INDEX "transaction_templates_user_id_idx" ON "transaction_templates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_templates_category_idx" ON "transaction_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transaction_templates_account_idx" ON "transaction_templates" USING btree ("default_account_id");--> statement-breakpoint
CREATE INDEX "transaction_templates_card_idx" ON "transaction_templates" USING btree ("default_credit_card_id");--> statement-breakpoint
CREATE INDEX "transaction_templates_billing_wallet_idx" ON "transaction_templates" USING btree ("default_billing_wallet_id");--> statement-breakpoint
CREATE INDEX "transaction_occurrences_user_date_idx" ON "transaction_occurrences" USING btree ("user_id","occurrence_date");--> statement-breakpoint
CREATE INDEX "recurrence_rules_user_id_idx" ON "recurrence_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallets_user_id_name_idx" ON "wallets" USING btree ("user_id","name");