import { t } from "@budget-manager/i18n";
import {
  hasInstallmentsWhenFixed,
  hasMatchingAccount,
  RecurringFieldsSchema,
  RecurringFormSchema,
} from "@budget-manager/schemas";
import { z } from "zod";

export const CreateRecurringInput = RecurringFormSchema;

export const UpdateRecurringInput = RecurringFieldsSchema.extend({
  id: z.uuid(),
})
  .refine(hasMatchingAccount, {
    error: () => t("validation.recurringAccount"),
    path: ["walletId"],
  })
  .refine(hasInstallmentsWhenFixed, {
    error: () => t("validation.recurringInstallments"),
    path: ["installments"],
  });

export const RecurringIdInput = z.object({ id: z.uuid() });

export const SetRecurringActiveInput = z.object({
  id: z.uuid(),
  isActive: z.boolean(),
});

export const ListRecurringInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});
