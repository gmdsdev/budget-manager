import { subscribedProcedure, router } from "../../index";
import {
  CreateCardPaymentInput,
  CreateCardPurchaseInput,
  CreateTransactionInput,
  CreateTransferInput,
  ImportTransactionsInput,
  ListTransactionsInput,
  TransactionIdInput,
  TransactionSummaryInput,
  TransferGroupIdInput,
  UpdateCardPaymentInput,
  UpdateCardPurchaseInput,
  UpdateTransactionInput,
  UpdateTransferInput,
} from "./validators";

export const transactionRouter = router({
  getAll: subscribedProcedure
    .input(ListTransactionsInput)
    .query(async ({ input, ctx }) => {
      const { limit, offset, ...filters } = input;

      return await ctx.services.transaction.getAll({
        userId: ctx.session.user.id,
        limit,
        offset,
        ...filters,
      });
    }),

  summary: subscribedProcedure
    .input(TransactionSummaryInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.transaction.getSummary({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  getTransfer: subscribedProcedure
    .input(TransferGroupIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.transaction.getTransfer({
        transferGroupId: input.transferGroupId,
        userId: ctx.session.user.id,
      });
    }),

  create: subscribedProcedure
    .input(CreateTransactionInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.create({
        userId: ctx.session.user.id,
        transaction: input,
      });
    }),

  import: subscribedProcedure
    .input(ImportTransactionsInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.importRows({
        userId: ctx.session.user.id,
        rows: input.rows,
      });
    }),

  update: subscribedProcedure
    .input(UpdateTransactionInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...transaction } = input;

      return await ctx.services.transaction.update({
        id,
        userId: ctx.session.user.id,
        transaction,
      });
    }),

  createTransfer: subscribedProcedure
    .input(CreateTransferInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createTransfer({
        userId: ctx.session.user.id,
        transfer: input,
      });
    }),

  updateTransfer: subscribedProcedure
    .input(UpdateTransferInput)
    .mutation(async ({ input, ctx }) => {
      const { transferGroupId, ...transfer } = input;

      return await ctx.services.transaction.updateTransfer({
        transferGroupId,
        userId: ctx.session.user.id,
        transfer,
      });
    }),

  deleteTransfer: subscribedProcedure
    .input(TransferGroupIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.deleteTransfer({
        transferGroupId: input.transferGroupId,
        userId: ctx.session.user.id,
      });
    }),

  createCardPurchase: subscribedProcedure
    .input(CreateCardPurchaseInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createCardPurchase({
        userId: ctx.session.user.id,
        purchase: input,
      });
    }),

  updateCardPurchase: subscribedProcedure
    .input(UpdateCardPurchaseInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...purchase } = input;

      return await ctx.services.transaction.updateCardPurchase({
        id,
        userId: ctx.session.user.id,
        purchase,
      });
    }),

  createCardPayment: subscribedProcedure
    .input(CreateCardPaymentInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createCardPayment({
        userId: ctx.session.user.id,
        payment: input,
      });
    }),

  updateCardPayment: subscribedProcedure
    .input(UpdateCardPaymentInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...payment } = input;

      return await ctx.services.transaction.updateCardPayment({
        id,
        userId: ctx.session.user.id,
        payment,
      });
    }),

  markPaid: subscribedProcedure
    .input(TransactionIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.markPaid({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: subscribedProcedure
    .input(TransactionIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
