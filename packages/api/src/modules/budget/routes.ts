import { subscribedProcedure, router } from "../../index";
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
  getAll: subscribedProcedure
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
  getMonth: subscribedProcedure
    .input(BudgetMonthInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.budget.getMonth({
        userId: ctx.session.user.id,
        month: input.month,
      });
    }),

  periods: subscribedProcedure
    .input(BudgetIdInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.budget.getPeriods({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  create: subscribedProcedure
    .input(CreateBudgetInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.create({
        userId: ctx.session.user.id,
        budget: input,
      });
    }),

  update: subscribedProcedure
    .input(UpdateBudgetInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...budget } = input;

      return await ctx.services.budget.update({
        id,
        userId: ctx.session.user.id,
        budget,
      });
    }),

  setActive: subscribedProcedure
    .input(SetBudgetActiveInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.setActive({
        id: input.id,
        userId: ctx.session.user.id,
        isActive: input.isActive,
      });
    }),

  delete: subscribedProcedure
    .input(BudgetIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  setPeriodAmount: subscribedProcedure
    .input(SetBudgetPeriodAmountInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.setPeriodAmount({
        id: input.id,
        userId: ctx.session.user.id,
        amountCents: input.amountCents,
      });
    }),

  resetPeriod: subscribedProcedure
    .input(BudgetPeriodIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.budget.resetPeriod({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
