import { z } from "zod";
import { WalletCurrency } from "../wallet/wallet.schema";

export const USER_NAME_MAX_LENGTH = 120;

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MAX_LENGTH = 128;

export const DEFAULT_PREFERRED_CURRENCY = WalletCurrency.BRL;

export const PreferredCurrencySchema = z.enum(Object.values(WalletCurrency));

export const UserNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(
    USER_NAME_MAX_LENGTH,
    `Name must be ${USER_NAME_MAX_LENGTH} characters or fewer`,
  );

export const NewPasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`,
  );

export const ProfileFormSchema = z.object({
  name: UserNameSchema,
});

export type ProfileFormDto = z.infer<typeof ProfileFormSchema>;

export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: NewPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: "New password must be different from the current one",
    path: ["newPassword"],
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormDto = z.infer<typeof ChangePasswordFormSchema>;

export const PreferencesFormSchema = z.object({
  preferredCurrency: PreferredCurrencySchema,
});

export type PreferencesFormDto = z.infer<typeof PreferencesFormSchema>;

export const USER_ADDITIONAL_FIELDS = {
  preferredCurrency: {
    type: "string",
    required: false,
    defaultValue: DEFAULT_PREFERRED_CURRENCY,
    validator: { input: PreferredCurrencySchema },
  },
} as const;

const PREFERRED_CURRENCIES = new Set<string>(Object.values(WalletCurrency));

export function toPreferredCurrency(
  value: string | null | undefined,
): WalletCurrency {
  return value && PREFERRED_CURRENCIES.has(value)
    ? (value as WalletCurrency)
    : DEFAULT_PREFERRED_CURRENCY;
}
