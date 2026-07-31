import {
  CardPaymentFormSchema,
  CardPurchaseFormSchema,
  DISTINCT_WALLETS_ERROR,
  FILTER_NONE,
  TransactionFormSchema,
  TransactionKind,
  TransactionRepeats,
  TransactionSchema,
  TransactionStatus,
  TransferFormFieldsSchema,
  TransferFormSchema,
  TransferGroupIdSchema,
  hasDistinctWallets,
} from "@budget-manager/schemas";
import { z } from "zod";
import { SearchTermInput } from "../../search";

export const CreateTransactionInput = TransactionFormSchema;

export const UpdateTransactionInput = TransactionFormSchema.extend({
  id: z.uuid(),
});

export const TransactionIdInput = TransactionSchema.pick({ id: true });

export const CreateTransferInput = TransferFormSchema;

export const UpdateTransferInput = TransferFormFieldsSchema.extend({
  transferGroupId: z.uuid(),
}).refine(hasDistinctWallets, DISTINCT_WALLETS_ERROR);

export const TransferGroupIdInput = TransferGroupIdSchema;

export const CreateCardPurchaseInput = CardPurchaseFormSchema;

export const UpdateCardPurchaseInput = CardPurchaseFormSchema.extend({
  id: z.uuid(),
});

export const CreateCardPaymentInput = CardPaymentFormSchema;

export const UpdateCardPaymentInput = CardPaymentFormSchema.extend({
  id: z.uuid(),
});

/**
 * The list's filters, shared with the summary so a figure and a row can never
 * disagree about what is in scope. Pagination is the list's alone.
 */
const TRANSACTION_FILTER_FIELDS = {
  search: SearchTermInput,
  kind: z.enum(Object.values(TransactionKind)).optional(),
  status: z.enum(Object.values(TransactionStatus)).optional(),
  walletId: z.uuid().optional(),
  creditCardId: z.uuid().optional(),
  categoryId: z.union([z.uuid(), z.literal(FILTER_NONE)]).optional(),
  repeats: z.enum(Object.values(TransactionRepeats)).optional(),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
} as const;

export const ListTransactionsInput = z
  .object({
    ...TRANSACTION_FILTER_FIELDS,
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListTransactionsDto = z.infer<typeof ListTransactionsInput>;

export const TransactionSummaryInput = z
  .object(TRANSACTION_FILTER_FIELDS)
  .prefault({});

export type TransactionSummaryDto = z.infer<typeof TransactionSummaryInput>;
