import {
  CreateWalletSchema,
  DeleteWalletSchema,
} from "@budget-manager/schemas";
import { protectedProcedure, router } from "../../index";

export const walletRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.wallet.getAll({ userId: ctx.session.user.id });
  }),

  create: protectedProcedure
    .input(CreateWalletSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.create({
        userId: ctx.session.user.id,
        wallet: input,
      });
    }),

  delete: protectedProcedure
    .input(DeleteWalletSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
