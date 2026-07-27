import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { categories } from "./category";
import { creditCards } from "./creditCard";
import { financialAccounts } from "./financialAccount";

/**
 * Enums
 */
export const transactionKindEnum = pgEnum("transaction_kind", [
  "income",
  "expense",
  "transfer_in",
  "transfer_out",
  "credit_card_purchase",
  "credit_card_payment",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "waiting_payment",
  "paid",
  "cancelled",
]);

/**
 * Transaction templates
 * This is the "master" record.
 */
export const transactionTemplates = pgTable("transaction_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  kind: transactionKindEnum("kind").notNull(),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),

  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),

  defaultAccountId: uuid("default_account_id").references(
    () => financialAccounts.id,
    {
      onDelete: "set null",
    },
  ),

  defaultCreditCardId: uuid("default_credit_card_id").references(
    () => creditCards.id,
    {
      onDelete: "set null",
    },
  ),

  defaultBillingFinancialAccountId: uuid(
    "default_billing_financial_account_id",
  ).references(() => financialAccounts.id, {
    onDelete: "set null",
  }),

  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
