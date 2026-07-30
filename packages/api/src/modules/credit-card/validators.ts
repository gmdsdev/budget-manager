import {
  CreditCardFormSchema,
  CreditCardSchema,
} from "@budget-manager/schemas";
import { z } from "zod";

export const CreateCreditCardInput = CreditCardFormSchema;

export const UpdateCreditCardInput = CreditCardFormSchema.extend({
  id: z.uuid(),
});

export const CreditCardIdInput = CreditCardSchema.pick({ id: true });

export const ListCreditCardBillsInput = z.object({
  creditCardId: z.uuid(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const ListCreditCardsInput = z
  .object({
    includeArchived: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListCreditCardsDto = z.infer<typeof ListCreditCardsInput>;
