import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { creditCards } from "./creditCard";
import { financialAccounts } from "./financialAccount";

/**
 * Enums
 */

export const creditCardBillStatusEnum = pgEnum("credit_card_bill_status", [
  "open",
  "waiting_payment",
  "paid",
  "cancelled",
]);

/**
 * Credit card bills
 * One row per month/cycle.
 */
export const creditCardBills = pgTable(
  "credit_card_bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    creditCardId: uuid("credit_card_id")
      .notNull()
      .references(() => creditCards.id, { onDelete: "cascade" }),

    // Account selected to pay this bill
    billingFinancialAccountId: uuid("billing_financial_account_id").references(
      () => financialAccounts.id,
      {
        onDelete: "set null",
      },
    ),

    // Statement period
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    // Actual closing and due dates for this bill instance
    closeAt: date("close_at").notNull(),
    dueAt: date("due_at").notNull(),

    status: creditCardBillStatusEnum("status").notNull().default("open"),

    // Cached totals, derived from transactions
    statementTotalCents: integer("statement_total_cents").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    usedLimitCents: integer("used_limit_cents").notNull().default(0),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("credit_card_bills_unique_cycle").on(
      table.creditCardId,
      table.periodStart,
      table.periodEnd,
    ),
    index("credit_card_bills_card_idx").on(table.creditCardId),
    index("credit_card_bills_status_idx").on(table.status),
  ],
);
