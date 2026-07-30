import { z } from "zod";
import { CategoryColor } from "./category-color";

export enum CategoryType {
  INCOME = "income",
  EXPENSE = "expense",
}

export const CategoryTypeLabelMap: Record<CategoryType, string> = {
  [CategoryType.INCOME]: "Income",
  [CategoryType.EXPENSE]: "Expense",
};

export const CATEGORY_NAME_MAX_LENGTH = 120;

export const CategorySchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      CATEGORY_NAME_MAX_LENGTH,
      `Name must be ${CATEGORY_NAME_MAX_LENGTH} characters or fewer`,
    ),
  type: z.enum(Object.values(CategoryType)),
  color: z.enum(Object.values(CategoryColor)),
  isArchived: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CategoryDto = z.infer<typeof CategorySchema>;

export const CategoryFormSchema = CategorySchema.pick({
  name: true,
  type: true,
  color: true,
});

export type CategoryFormDto = z.infer<typeof CategoryFormSchema>;

export const DeleteCategorySchema = CategorySchema.pick({ id: true });

export type DeleteCategoryDto = z.infer<typeof DeleteCategorySchema>;
