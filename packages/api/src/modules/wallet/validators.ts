import { WalletFormSchema, WalletSchema } from "@budget-manager/schemas";
import { z } from "zod";

export const CreateWalletInput = WalletFormSchema;

export const UpdateWalletInput = WalletFormSchema.extend({ id: z.uuid() });

export const WalletIdInput = WalletSchema.pick({ id: true });

export const ListWalletsInput = z
  .object({
    includeArchived: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0),
  })
  .prefault({});

export type ListWalletsDto = z.infer<typeof ListWalletsInput>;
