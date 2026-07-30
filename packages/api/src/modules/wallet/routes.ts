import { protectedProcedure, router } from "../../index";
import {
  CreateWalletInput,
  ListWalletsInput,
  UpdateWalletInput,
  WalletIdInput,
} from "./validators";

export const walletRouter = router({
  getAll: protectedProcedure
    .input(ListWalletsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.wallet.getAll({
        userId: ctx.session.user.id,
        includeArchived: input.includeArchived,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.wallet.getOptions({
      userId: ctx.session.user.id,
    });
  }),

  create: protectedProcedure
    .input(CreateWalletInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.create({
        userId: ctx.session.user.id,
        wallet: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateWalletInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...patch } = input;

      return await ctx.services.wallet.update({
        id,
        userId: ctx.session.user.id,
        patch,
      });
    }),

  archive: protectedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: protectedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
