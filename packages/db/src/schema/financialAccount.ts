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

/**
 * Enums
 */
export const financialAccountTypeEnum = pgEnum("financial_account_type", [
  "checking",
  "savings",
  "investments",
  "cash",
]);

/**
 * Financial Accounts
 */
export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  type: financialAccountTypeEnum("type").notNull(),

  currencyCode: text("currency_code").notNull().default("BRL"),

  // Optional cache fields
  openingBalanceCents: integer("opening_balance_cents").notNull().default(0),
  currentBalanceCents: integer("current_balance_cents").notNull().default(0),

  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
