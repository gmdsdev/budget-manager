import { protectedProcedure, router } from "../../index";
import {
  CreateCardPaymentInput,
  CreateCardPurchaseInput,
  CreateTransactionInput,
  CreateTransferInput,
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
  getAll: protectedProcedure
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

  summary: protectedProcedure
    .input(TransactionSummaryInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.transaction.getSummary({
        userId: ctx.session.user.id,
        ...input,
      });
    }),

  getTransfer: protectedProcedure
    .input(TransferGroupIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.transaction.getTransfer({
        transferGroupId: input.transferGroupId,
        userId: ctx.session.user.id,
      });
    }),

  create: protectedProcedure
    .input(CreateTransactionInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.create({
        userId: ctx.session.user.id,
        transaction: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateTransactionInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...transaction } = input;

      return await ctx.services.transaction.update({
        id,
        userId: ctx.session.user.id,
        transaction,
      });
    }),

  createTransfer: protectedProcedure
    .input(CreateTransferInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createTransfer({
        userId: ctx.session.user.id,
        transfer: input,
      });
    }),

  updateTransfer: protectedProcedure
    .input(UpdateTransferInput)
    .mutation(async ({ input, ctx }) => {
      const { transferGroupId, ...transfer } = input;

      return await ctx.services.transaction.updateTransfer({
        transferGroupId,
        userId: ctx.session.user.id,
        transfer,
      });
    }),

  deleteTransfer: protectedProcedure
    .input(TransferGroupIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.deleteTransfer({
        transferGroupId: input.transferGroupId,
        userId: ctx.session.user.id,
      });
    }),

  createCardPurchase: protectedProcedure
    .input(CreateCardPurchaseInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createCardPurchase({
        userId: ctx.session.user.id,
        purchase: input,
      });
    }),

  updateCardPurchase: protectedProcedure
    .input(UpdateCardPurchaseInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...purchase } = input;

      return await ctx.services.transaction.updateCardPurchase({
        id,
        userId: ctx.session.user.id,
        purchase,
      });
    }),

  createCardPayment: protectedProcedure
    .input(CreateCardPaymentInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.createCardPayment({
        userId: ctx.session.user.id,
        payment: input,
      });
    }),

  updateCardPayment: protectedProcedure
    .input(UpdateCardPaymentInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...payment } = input;

      return await ctx.services.transaction.updateCardPayment({
        id,
        userId: ctx.session.user.id,
        payment,
      });
    }),

  markPaid: protectedProcedure
    .input(TransactionIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.markPaid({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(TransactionIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.transaction.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
