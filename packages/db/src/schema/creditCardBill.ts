import {
  date,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { creditCards } from "./creditCard";
import { wallets } from "./wallet";

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
    billingWalletId: uuid("billing_wallet_id").references(() => wallets.id, {
      onDelete: "set null",
    }),

    // Statement period
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),

    // Actual closing and due dates for this bill instance
    closeAt: date("close_at").notNull(),
    dueAt: date("due_at").notNull(),

    // No stored status or cached totals: the statement total and paid amount are
    // summed from the linked occurrences, and a bill "closes" simply by closeAt
    // passing. Storing either would need a scheduler and could drift.

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("credit_card_bills_unique_cycle").on(
      table.creditCardId,
      table.periodStart,
      table.periodEnd,
    ),
    index("credit_card_bills_card_idx").on(table.creditCardId),
    index("credit_card_bills_user_id_idx").on(table.userId),
    index("credit_card_bills_billing_wallet_idx").on(table.billingWalletId),
  ],
);
