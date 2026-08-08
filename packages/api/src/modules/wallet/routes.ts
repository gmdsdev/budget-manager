import { subscribedProcedure, router } from "../../index";
import {
  CreateWalletInput,
  ListWalletsInput,
  UpdateWalletInput,
  WalletIdInput,
} from "./validators";

export const walletRouter = router({
  getAll: subscribedProcedure
    .input(ListWalletsInput)
    .query(async ({ input, ctx }) => {
      const { limit, offset, includeArchived, ...filters } = input;

      return await ctx.services.wallet.getAll({
        userId: ctx.session.user.id,
        includeArchived,
        limit,
        offset,
        ...filters,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: subscribedProcedure.query(async ({ ctx }) => {
    return await ctx.services.wallet.getOptions({
      userId: ctx.session.user.id,
    });
  }),

  create: subscribedProcedure
    .input(CreateWalletInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.create({
        userId: ctx.session.user.id,
        wallet: input,
      });
    }),

  update: subscribedProcedure
    .input(UpdateWalletInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...patch } = input;

      return await ctx.services.wallet.update({
        id,
        userId: ctx.session.user.id,
        patch,
      });
    }),

  archive: subscribedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: subscribedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: subscribedProcedure
    .input(WalletIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.wallet.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
