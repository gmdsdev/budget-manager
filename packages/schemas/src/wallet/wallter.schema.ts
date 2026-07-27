import { z } from "zod";

export const CreateWalletSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["checking", "savings", "investments", "cash"]),
  balance: z.number(),
  currency: z.string().min(1),
});

export type CreateWalletDto = z.infer<typeof CreateWalletSchema>;

export const DeleteWalletSchema = z.object({
  id: z.uuid(),
});

export type DeleteWalletDto = z.infer<typeof DeleteWalletSchema>;
