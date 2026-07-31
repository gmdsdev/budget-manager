import { t } from "@budget-manager/i18n";
import { z } from "zod";
import { CategoryColor } from "./category-color";

export enum CategoryType {
  INCOME = "income",
  EXPENSE = "expense",
}

export const CATEGORY_NAME_MAX_LENGTH = 120;

export const CategorySchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, { error: () => t("validation.nameRequired") })
    .max(CATEGORY_NAME_MAX_LENGTH, {
      error: () =>
        t("validation.nameTooLong", { max: CATEGORY_NAME_MAX_LENGTH }),
    }),
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
