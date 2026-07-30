import {
  CardPaymentFormSchema,
  CardPurchaseFormSchema,
  DISTINCT_WALLETS_ERROR,
  TransactionFormSchema,
  TransactionKind,
  TransactionSchema,
  TransactionStatus,
  TransferFormFieldsSchema,
  TransferFormSchema,
  TransferGroupIdSchema,
  hasDistinctWallets,
} from "@budget-manager/schemas";
import { z } from "zod";

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

export const ListTransactionsInput = z
  .object({
    kind: z.enum(Object.values(TransactionKind)).optional(),
    status: z.enum(Object.values(TransactionStatus)).optional(),
    walletId: z.uuid().optional(),
    categoryId: z.uuid().optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListTransactionsDto = z.infer<typeof ListTransactionsInput>;
