import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { categories } from "./category";
import { recurrenceTypeEnum } from "./recurrenceRule";

/**
 * Budgets
 * The recurring spending limit for one category, in one currency. This is the
 * "master" record, the same relationship `transaction_templates` has with the
 * occurrences it generates: the periods below are the ledger, this is only what
 * laid them down.
 */
export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),

    currencyCode: text("currency_code").notNull().default("BRL"),

    amountCents: integer("amount_cents").notNull(),

    recurrenceType: recurrenceTypeEnum("recurrence_type").notNull(),

    // Every 1 month, every 3 months, every 1 year, etc.
    interval: integer("interval").notNull().default(1),

    // Only for fixed.
    installments: integer("installments"),

    // Month keys, not dates: a budget period is a whole calendar month.
    startsOn: text("starts_on").notNull(),
    endsOn: text("ends_on"),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("budgets_category_currency_unique").on(
      table.userId,
      table.categoryId,
      table.currencyCode,
    ),
    index("budgets_user_id_idx").on(table.userId),
    index("budgets_category_idx").on(table.categoryId),
  ],
);

/**
 * Budget periods
 * One materialized month of a budget. `budget_id` is provenance only and is
 * `ON DELETE SET NULL`, so a month the user has already lived through survives
 * its series being deleted — exactly like a settled occurrence does.
 *
 * `is_override` is what separates a month the series laid down from a month the
 * user set by hand. Re-laying a schedule may only touch the former.
 */
export const budgetPeriods = pgTable(
  "budget_periods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    budgetId: uuid("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),

    currencyCode: text("currency_code").notNull().default("BRL"),

    // `YYYY-MM`, the key the spending queries group by.
    periodMonth: text("period_month").notNull(),

    amountCents: integer("amount_cents").notNull(),

    isOverride: boolean("is_override").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // One limit per category, currency and month — whichever series wrote it.
    uniqueIndex("budget_periods_month_unique").on(
      table.userId,
      table.categoryId,
      table.currencyCode,
      table.periodMonth,
    ),
    index("budget_periods_user_month_idx").on(table.userId, table.periodMonth),
    index("budget_periods_budget_idx").on(table.budgetId),
  ],
);
