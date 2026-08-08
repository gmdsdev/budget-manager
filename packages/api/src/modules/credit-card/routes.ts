import { subscribedProcedure, router } from "../../index";
import {
  CreateCreditCardInput,
  ListCreditCardBillsInput,
  CreditCardIdInput,
  ListCreditCardsInput,
  UpdateCreditCardInput,
} from "./validators";

export const creditCardRouter = router({
  getAll: subscribedProcedure
    .input(ListCreditCardsInput)
    .query(async ({ input, ctx }) => {
      const { limit, offset, includeArchived, ...filters } = input;

      return await ctx.services.creditCard.getAll({
        userId: ctx.session.user.id,
        includeArchived,
        limit,
        offset,
        ...filters,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: subscribedProcedure.query(async ({ ctx }) => {
    return await ctx.services.creditCard.getOptions({
      userId: ctx.session.user.id,
    });
  }),

  bills: subscribedProcedure
    .input(ListCreditCardBillsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.creditCard.getBills({
        userId: ctx.session.user.id,
        creditCardId: input.creditCardId,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  create: subscribedProcedure
    .input(CreateCreditCardInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.create({
        userId: ctx.session.user.id,
        card: input,
      });
    }),

  update: subscribedProcedure
    .input(UpdateCreditCardInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...card } = input;

      return await ctx.services.creditCard.update({
        id,
        userId: ctx.session.user.id,
        card,
      });
    }),

  archive: subscribedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: subscribedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: subscribedProcedure
    .input(CreditCardIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.creditCard.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
