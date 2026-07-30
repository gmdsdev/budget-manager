import { protectedProcedure, router } from "../../index";
import {
  CategoryIdInput,
  CategoryOptionsInput,
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./validators";

export const categoryRouter = router({
  getAll: protectedProcedure
    .input(ListCategoriesInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.category.getAll({
        userId: ctx.session.user.id,
        type: input.type,
        includeArchived: input.includeArchived,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: protectedProcedure
    .input(CategoryOptionsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.category.getOptions({
        userId: ctx.session.user.id,
        type: input.type,
      });
    }),

  create: protectedProcedure
    .input(CreateCategoryInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.create({
        userId: ctx.session.user.id,
        category: input,
      });
    }),

  update: protectedProcedure
    .input(UpdateCategoryInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...patch } = input;

      return await ctx.services.category.update({
        id,
        userId: ctx.session.user.id,
        patch,
      });
    }),

  archive: protectedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: protectedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
