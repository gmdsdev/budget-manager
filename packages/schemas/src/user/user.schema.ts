import { DEFAULT_LOCALE, Locale, t, toLocale } from "@budget-manager/i18n";
import { z } from "zod";
import { WalletCurrency } from "../wallet/wallet.schema";

export const USER_NAME_MAX_LENGTH = 120;

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_MAX_LENGTH = 128;

export const DEFAULT_PREFERRED_CURRENCY = WalletCurrency.BRL;

export const PreferredCurrencySchema = z.enum(Object.values(WalletCurrency));

export const PreferredLocaleSchema = z.enum(Object.values(Locale));

export const UserNameSchema = z
  .string()
  .trim()
  .min(1, { error: () => t("validation.nameRequired") })
  .max(USER_NAME_MAX_LENGTH, {
    error: () => t("validation.nameTooLong", { max: USER_NAME_MAX_LENGTH }),
  });

export const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    error: () => t("validation.passwordTooShort", { min: PASSWORD_MIN_LENGTH }),
  })
  .max(PASSWORD_MAX_LENGTH, {
    error: () => t("validation.passwordTooLong", { max: PASSWORD_MAX_LENGTH }),
  });

export const UserEmailSchema = z.email({
  error: () => t("validation.invalidEmail"),
});

export const ProfileFormSchema = z.object({
  name: UserNameSchema,
});

export type ProfileFormDto = z.infer<typeof ProfileFormSchema>;

/**
 * The auth forms validate with these rather than rules of their own. Sign-up
 * and the settings profile form both write `user.name`, and sign-up and the
 * change-password form both write a password, so a rule either screen invents
 * locally is a rule the other one disagrees with — sign-up used to accept a
 * name the profile form would then refuse to save, and a password longer than
 * better-auth accepts.
 */
export const SignInFormSchema = z.object({
  email: UserEmailSchema,
  password: NewPasswordSchema,
});

export type SignInFormDto = z.infer<typeof SignInFormSchema>;

export const SignUpFormSchema = SignInFormSchema.extend({
  name: UserNameSchema,
});

export type SignUpFormDto = z.infer<typeof SignUpFormSchema>;

export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: () => t("validation.currentPasswordRequired") }),
    newPassword: NewPasswordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: () => t("validation.confirmYourNewPassword") }),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: () => t("validation.newPasswordMustDiffer"),
    path: ["newPassword"],
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    error: () => t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

export type ChangePasswordFormDto = z.infer<typeof ChangePasswordFormSchema>;

export const PreferencesFormSchema = z.object({
  preferredCurrency: PreferredCurrencySchema,
});

export type PreferencesFormDto = z.infer<typeof PreferencesFormSchema>;

export const LanguageFormSchema = z.object({
  preferredLocale: PreferredLocaleSchema,
});

export type LanguageFormDto = z.infer<typeof LanguageFormSchema>;

/**
 * Declared once and spread into both the better-auth server instance and the
 * client's `inferAdditionalFields`, so a field's name, optionality and default
 * cannot drift between the two.
 *
 * `preferredLocale` rides here rather than in localStorage alone because a
 * language is a property of the person, not of the browser: signing in on a
 * second device must not put the app back into English. The web app still
 * mirrors it locally, which is what covers the login screen and the first
 * paint, before any session exists.
 */
export const USER_ADDITIONAL_FIELDS = {
  preferredCurrency: {
    type: "string",
    required: false,
    defaultValue: DEFAULT_PREFERRED_CURRENCY,
    validator: { input: PreferredCurrencySchema },
  },
  preferredLocale: {
    type: "string",
    required: false,
    defaultValue: DEFAULT_LOCALE,
    validator: { input: PreferredLocaleSchema },
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

/**
 * Narrows a stored locale the way {@link toPreferredCurrency} narrows a stored
 * currency: a value that is no longer in {@link Locale} must not reach a
 * `<Select>` as a value with no matching item.
 */
export const toPreferredLocale = toLocale;
