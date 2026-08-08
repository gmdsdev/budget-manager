import { subscribedProcedure, router } from "../../index";
import {
  CategoryIdInput,
  CategoryOptionsInput,
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./validators";

export const categoryRouter = router({
  getAll: subscribedProcedure
    .input(ListCategoriesInput)
    .query(async ({ input, ctx }) => {
      const { limit, offset, includeArchived, ...filters } = input;

      return await ctx.services.category.getAll({
        userId: ctx.session.user.id,
        includeArchived,
        limit,
        offset,
        ...filters,
      });
    }),

  // Unpaginated, for select inputs. See CLAUDE.md on pagination.
  options: subscribedProcedure
    .input(CategoryOptionsInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.category.getOptions({
        userId: ctx.session.user.id,
        type: input.type,
      });
    }),

  create: subscribedProcedure
    .input(CreateCategoryInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.create({
        userId: ctx.session.user.id,
        category: input,
      });
    }),

  update: subscribedProcedure
    .input(UpdateCategoryInput)
    .mutation(async ({ input, ctx }) => {
      const { id, ...patch } = input;

      return await ctx.services.category.update({
        id,
        userId: ctx.session.user.id,
        patch,
      });
    }),

  archive: subscribedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.archive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  unarchive: subscribedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.unarchive({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),

  delete: subscribedProcedure
    .input(CategoryIdInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.category.delete({
        id: input.id,
        userId: ctx.session.user.id,
      });
    }),
});
