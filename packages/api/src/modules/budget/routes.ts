import { protectedProcedure, router } from "../../index";
import {
  BudgetIdInput,
  BudgetMonthInput,
  BudgetPeriodIdInput,
  CreateBudgetInput,
  ListBudgetsInput,
  SetBudgetActiveInput,
  SetBudgetPeriodAmountInput,
  UpdateBudgetInput,
} from "./validators";

export const budgetRouter = router({
  getAll: protectedProcedure
    .input(ListBudgetsInput)
    .query(async ({ input, ctx }) => {
      const { limit, offset, ...filters } = input;

      return await ctx.services.budget.getAll({
        userId: ctx.session.user.id,
        limit,
        offset,
        ...filters,
      });
    }),

  // Unpaginated on purpose: the figures describe a whole month.
  getMonth: protectedProcedure
    .input(BudgetMonthInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.budget.getMonth({
        userId: ctx.session.user.id,
        month: input.month,
      });
    }),

  periods: protectedProcedure
    .input(BudgetIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.budget.getPeriods({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  create: protectedProcedure
    .input(CreateBudgetInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.create({
        userId: ctx.session.user.id,
        budget: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateBudgetInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...budget } = input;

      return await ctx.services.budget.update({
        id,
        userId: ctx.session.user.id,
        budget,
      });
    }),

  setActive: protectedProcedure
    .input(SetBudgetActiveInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.setActive({
        id: input.id,
        userId: ctx.session.user.id,
        isActive: input.isActive,
      });
    }),

  delete: protectedProcedure
    .input(BudgetIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  setPeriodAmount: protectedProcedure
    .input(SetBudgetPeriodAmountInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.setPeriodAmount({
        id: input.id,
        userId: ctx.session.user.id,
        amountCents: input.amountCents,
      });
    }),

  resetPeriod: protectedProcedure
    .input(BudgetPeriodIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.resetPeriod({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
