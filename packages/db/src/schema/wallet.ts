import {
  boolean,
  index,
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
export const walletTypeEnum = pgEnum("wallet_type", [
  "checking",
  "savings",
  "investments",
  "cash",
]);

/**
 * Wallets
 */
export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: walletTypeEnum("type").notNull(),

    currencyCode: text("currency_code").notNull().default("BRL"),

    openingBalanceCents: integer("opening_balance_cents").notNull().default(0),

    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("wallets_user_id_name_idx").on(table.userId, table.name)],
);
