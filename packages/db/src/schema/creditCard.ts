import {
  boolean,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { wallets } from "./wallet";

/**
 * Credit cards
 */
export const creditCards = pgTable("credit_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  name: text("name").notNull(),

  // Use cents to keep it exact
  limitCents: integer("limit_cents").notNull(),

  // Day of month when statement closes / becomes part of the next bill
  closeDay: smallint("close_day").notNull(),

  // Day of month when payment is due
  dueDay: smallint("due_day").notNull(),

  // Default wallet used to pay card bills
  defaultBillingWalletId: uuid("default_billing_wallet_id").references(
    () => wallets.id,
    {
      onDelete: "set null",
    },
  ),

  currencyCode: text("currency_code").notNull().default("BRL"),

  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
