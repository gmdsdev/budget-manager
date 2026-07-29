import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { categories } from "./category";
import { creditCards } from "./creditCard";
import { creditCardBills } from "./creditCardBill";
import { wallets } from "./wallet";
import {
  transactionKindEnum,
  transactionStatusEnum,
  transactionTemplates,
} from "./transactionTemplate";

/**
 * Real transaction occurrences
 * This replaces TransactionsAccounts + TransactionsCreditCards.
 */
export const transactionOccurrences = pgTable(
  "transaction_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    templateId: uuid("template_id").references(() => transactionTemplates.id, {
      onDelete: "set null",
    }),

    kind: transactionKindEnum("kind").notNull(),
    status: transactionStatusEnum("status")
      .notNull()
      .default("waiting_payment"),

    name: text("name").notNull(),
    amountCents: integer("amount_cents").notNull(),

    occurrenceDate: date("occurrence_date").notNull(),

    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),

    walletId: uuid("wallet_id").references(() => wallets.id, {
      onDelete: "set null",
    }),

    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "set null",
    }),

    creditCardBillId: uuid("credit_card_bill_id").references(
      () => creditCardBills.id,
      {
        onDelete: "set null",
      },
    ),

    notes: text("notes"),

    paidAt: timestamp("paid_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("transaction_occurrences_wallet_idx").on(
      table.walletId,
      table.occurrenceDate,
    ),
    index("transaction_occurrences_user_date_idx").on(
      table.userId,
      table.occurrenceDate,
    ),
    index("transaction_occurrences_card_idx").on(
      table.creditCardId,
      table.occurrenceDate,
    ),
    index("transaction_occurrences_bill_idx").on(table.creditCardBillId),
    index("transaction_occurrences_template_idx").on(table.templateId),
    index("transaction_occurrences_status_idx").on(table.status),
  ],
);
