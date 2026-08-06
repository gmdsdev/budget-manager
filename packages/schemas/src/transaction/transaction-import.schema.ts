import { t } from "@budget-manager/i18n";
import { z } from "zod";
import {
  CardPurchaseFormSchema,
  TransactionFormSchema,
} from "./transaction.schema";

/**
 * A whole file lands in one request and one INSERT, so the cap bounds both. The
 * biggest existing write batch is a series' 360 installments; 500 covers a
 * year-plus of typical bank exports.
 */
export const IMPORT_MAX_ROWS = 500;

const ImportWalletRowSchema = TransactionFormSchema.extend({
  target: z.literal("wallet"),
});

const ImportCardRowSchema = CardPurchaseFormSchema.extend({
  target: z.literal("card"),
});

/**
 * A row targets a wallet (income/expense) or a card (a purchase), never both —
 * the same rule the ledger itself lives by. Reusing the two form schemas keeps
 * every field rule identical to the single-row create paths.
 */
export const ImportTransactionRowSchema = z.discriminatedUnion("target", [
  ImportWalletRowSchema,
  ImportCardRowSchema,
]);

export type ImportTransactionRowDto = z.infer<
  typeof ImportTransactionRowSchema
>;

export const ImportTransactionsSchema = z.object({
  rows: z
    .array(ImportTransactionRowSchema)
    .min(1)
    .max(IMPORT_MAX_ROWS, {
      error: () => t("validation.importTooManyRows", { max: IMPORT_MAX_ROWS }),
    }),
});

export type ImportTransactionsDto = z.infer<typeof ImportTransactionsSchema>;
