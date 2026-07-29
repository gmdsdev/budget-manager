import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { transactionTemplates } from "./transactionTemplate";

/**
 * Enums
 */

export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "fixed",
  "weekly",
  "monthly",
  "yearly",
]);

/**
 * Recurrence rules
 * For fixed, installments is required.
 * For weekly/monthly/yearly, generate as far as your app needs.
 */
export const recurrenceRules = pgTable(
  "recurrence_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    templateId: uuid("template_id")
      .notNull()
      .references(() => transactionTemplates.id, { onDelete: "cascade" }),

    recurrenceType: recurrenceTypeEnum("recurrence_type").notNull(),

    // Example: every 1 month, every 2 weeks, etc.
    interval: integer("interval").notNull().default(1),

    // Only for fixed
    installments: integer("installments"),

    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on"),

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
    uniqueIndex("recurrence_rules_template_unique").on(table.templateId),
    index("recurrence_rules_user_id_idx").on(table.userId),
  ],
);
