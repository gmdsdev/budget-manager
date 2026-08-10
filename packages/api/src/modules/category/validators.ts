import {
  CategoryFormSchema,
  CategorySchema,
  CategoryType,
  PreferredLocaleSchema,
} from "@budget-manager/schemas";
import { z } from "zod";
import { SearchTermInput } from "../../search";

export const CreateCategoryInput = CategoryFormSchema;

export const EnsureDefaultCategoriesInput = z.object({
  locale: PreferredLocaleSchema,
});

export const UpdateCategoryInput = CategoryFormSchema.extend({ id: z.uuid() });

export const CategoryIdInput = CategorySchema.pick({ id: true });

export const CategoryOptionsInput = z
  .object({
    type: z.enum(Object.values(CategoryType)).optional(),
  })
  .prefault({});

export const ListCategoriesInput = z
  .object({
    search: SearchTermInput,
    type: z.enum(Object.values(CategoryType)).optional(),
    includeArchived: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListCategoriesDto = z.infer<typeof ListCategoriesInput>;
