import { RecurringFieldsSchema, RecurringFormSchema } from "@budget-manager/schemas";
import { z } from "zod";
import {
  hasInstallmentsWhenFixed,
  hasMatchingAccount,
  RECURRING_ACCOUNT_MESSAGE,
  RECURRING_INSTALLMENTS_MESSAGE,
} from "@budget-manager/schemas";

export const CreateRecurringInput = RecurringFormSchema;

export const UpdateRecurringInput = RecurringFieldsSchema.extend({
  id: z.uuid(),
})
  .refine(hasMatchingAccount, {
    message: RECURRING_ACCOUNT_MESSAGE,
    path: ["walletId"],
  })
  .refine(hasInstallmentsWhenFixed, {
    message: RECURRING_INSTALLMENTS_MESSAGE,
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
