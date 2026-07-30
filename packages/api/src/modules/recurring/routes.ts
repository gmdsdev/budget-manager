import { protectedProcedure, router } from "../../index";
import {
  CreateRecurringInput,
  ListRecurringInput,
  RecurringIdInput,
  SetRecurringActiveInput,
  UpdateRecurringInput,
} from "./validators";

export const recurringRouter = router({
  getAll: protectedProcedure
    .input(ListRecurringInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.recurring.getAll({
        userId: ctx.session.user.id,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  create: protectedProcedure
    .input(CreateRecurringInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.recurring.create({
        userId: ctx.session.user.id,
        recurring: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateRecurringInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...recurring } = input;

      return await ctx.services.recurring.update({
        id,
        userId: ctx.session.user.id,
        recurring,
      });
    }),

  setActive: protectedProcedure
    .input(SetRecurringActiveInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.recurring.setActive({
        id: input.id,
        userId: ctx.session.user.id,
        isActive: input.isActive,
      });
    }),

  delete: protectedProcedure
    .input(RecurringIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.recurring.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
