import { t } from "@budget-manager/i18n";
import {
  BudgetFieldsSchema,
  BudgetFormSchema,
  BudgetPeriodAmountSchema,
  hasInstallmentsWhenFixed,
  MonthKeySchema,
  WalletCurrency,
} from "@budget-manager/schemas";
import { z } from "zod";
import { SearchTermInput } from "../../search";

export const CreateBudgetInput = BudgetFormSchema;

export const UpdateBudgetInput = BudgetFieldsSchema.extend({
  id: z.uuid(),
}).refine(hasInstallmentsWhenFixed, {
  error: () => t("validation.budgetInstallments"),
  path: ["installments"],
});

export const BudgetIdInput = z.object({ id: z.uuid() });

export const SetBudgetActiveInput = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

export const SetBudgetPeriodAmountInput = BudgetPeriodAmountSchema;

export const BudgetPeriodIdInput = z.object({ id: z.uuid() });

export const BudgetMonthInput = z
  .object({ month: MonthKeySchema.optional() })
  .prefault({});

export const ListBudgetsInput = z
  .object({
    search: SearchTermInput,
    categoryId: z.uuid().optional(),
    currencyCode: z.enum(Object.values(WalletCurrency)).optional(),
    isActive: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListBudgetsDto = z.infer<typeof ListBudgetsInput>;
