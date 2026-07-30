import {
  WalletCurrency,
  WalletFormSchema,
  WalletSchema,
  WalletType,
} from "@budget-manager/schemas";
import { z } from "zod";
import { SearchTermInput } from "../../search";

export const CreateWalletInput = WalletFormSchema;

export const UpdateWalletInput = WalletFormSchema.extend({ id: z.uuid() });

export const WalletIdInput = WalletSchema.pick({ id: true });

export const ListWalletsInput = z
  .object({
    search: SearchTermInput,
    type: z.enum(Object.values(WalletType)).optional(),
    currencyCode: z.enum(Object.values(WalletCurrency)).optional(),
    includeArchived: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListWalletsDto = z.infer<typeof ListWalletsInput>;
