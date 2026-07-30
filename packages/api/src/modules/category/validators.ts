import {
  CategoryFormSchema,
  CategorySchema,
  CategoryType,
} from "@budget-manager/schemas";
import { z } from "zod";

export const CreateCategoryInput = CategoryFormSchema;

export const UpdateCategoryInput = CategoryFormSchema.extend({ id: z.uuid() });

export const CategoryIdInput = CategorySchema.pick({ id: true });

export const CategoryOptionsInput = z
  .object({
    type: z.enum(Object.values(CategoryType)).optional(),
  })
  .prefault({});

export const ListCategoriesInput = z
  .object({
    type: z.enum(Object.values(CategoryType)).optional(),
    includeArchived: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListCategoriesDto = z.infer<typeof ListCategoriesInput>;
