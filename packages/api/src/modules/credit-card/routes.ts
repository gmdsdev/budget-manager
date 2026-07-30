import { protectedProcedure, router } from "../../index";
import {
  CreateCreditCardInput,
  ListCreditCardBillsInput,
  CreditCardIdInput,
  ListCreditCardsInput,
  UpdateCreditCardInput,
} from "./validators";

export const creditCardRouter = router({
  getAll: protectedProcedure
    .input(ListCreditCardsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.creditCard.getAll({
        userId: ctx.session.user.id,
        includeArchived: input.includeArchived,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.creditCard.getOptions({
      userId: ctx.session.user.id,
    });
  }),

  bills: protectedProcedure
    .input(ListCreditCardBillsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.creditCard.getBills({
        userId: ctx.session.user.id,
        creditCardId: input.creditCardId,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  create: protectedProcedure
    .input(CreateCreditCardInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.create({
        userId: ctx.session.user.id,
        card: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateCreditCardInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...card } = input;

      return await ctx.services.creditCard.update({
        id,
        userId: ctx.session.user.id,
        card,
      });
    }),

  archive: protectedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: protectedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
