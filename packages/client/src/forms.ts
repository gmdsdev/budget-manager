import {
  BudgetFormSchema,
  BudgetPeriodFormSchema,
  CardPaymentFormSchema,
  CardPurchaseFormSchema,
  CategoryFormSchema,
  ChangePasswordFormSchema,
  CreditCardFormSchema,
  LanguageFormSchema,
  OnboardingPreferencesFormSchema,
  PreferencesFormSchema,
  ProfileFormSchema,
  RecurringFormSchema,
  TransactionFormSchema,
  TransferFormSchema,
  WalletFormSchema,
  type BudgetFormDto,
  type BudgetPeriodFormDto,
  type CardPaymentFormDto,
  type CardPurchaseFormDto,
  type CategoryFormDto,
  type ChangePasswordFormDto,
  type CreditCardFormDto,
  type LanguageFormDto,
  type OnboardingPreferencesFormDto,
  type PreferencesFormDto,
  type ProfileFormDto,
  type RecurringFormDto,
  type TransactionFormDto,
  type TransferFormDto,
  type WalletFormDto,
} from "@budget-manager/schemas";
import { revalidateLogic, useForm } from "@tanstack/react-form";
import type { StandardSchemaV1 } from "@tanstack/react-form";

/**
 * The one validation-logic object every form in both apps passes. **One cause,
 * revalidated on change**: TanStack keys errors by cause and only the same cause clears
 * them, so splitting a schema across change and blur strands a blur-sourced error — and
 * the select primitives never fire blur at all, which leaves `canSubmit` false after the
 * user has already fixed the field and makes a form need two taps to submit.
 */
export const FORM_VALIDATION_LOGIC = revalidateLogic({
  mode: "change",
  modeAfterSubmission: "change",
});

type FieldLike = {
  state: {
    meta: {
      isTouched: boolean;
      isValid: boolean;
      errors: unknown[];
    };
  };
};

/**
 * Validation is eager, so error *display* is gated on the field having been touched.
 * Submitting marks every field touched, which is what makes a failed submit reveal
 * everything at once.
 */
export function isFieldInvalid(field: FieldLike) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

/** The messages to show, or none while the field is untouched. */
export function fieldErrors(field: FieldLike): { message?: string }[] {
  return isFieldInvalid(field)
    ? (field.state.meta.errors as { message?: string }[])
    : [];
}

/**
 * Every form in the app is this: default values, a submit, and the **same** shared Zod
 * schema the tRPC procedure validates with as the single `onDynamic` validator — so
 * client and server validation cannot diverge.
 *
 * One factory rather than a dozen near-identical hooks, and one per shape below so a
 * caller still names the form it is building and gets its DTO checked.
 */
function formHook<TValues>(schema: StandardSchemaV1<TValues, unknown>) {
  return ({
    onSubmit,
    defaultValues,
  }: {
    onSubmit: (values: TValues) => Promise<unknown>;
    defaultValues: TValues;
  }) =>
    useForm({
      defaultValues,
      onSubmit: ({ value }) => onSubmit(value),
      validationLogic: FORM_VALIDATION_LOGIC,
      validators: { onDynamic: schema },
    });
}

export const useWalletForm = formHook<WalletFormDto>(WalletFormSchema);
export type UseWalletFormReturnType = ReturnType<typeof useWalletForm>;

export const useCategoryForm = formHook<CategoryFormDto>(CategoryFormSchema);
export type UseCategoryFormReturnType = ReturnType<typeof useCategoryForm>;

export const useCreditCardForm = formHook<CreditCardFormDto>(CreditCardFormSchema);
export type UseCreditCardFormReturnType = ReturnType<typeof useCreditCardForm>;

export const useTransactionForm = formHook<TransactionFormDto>(TransactionFormSchema);
export type UseTransactionFormReturnType = ReturnType<typeof useTransactionForm>;

export const useTransferForm = formHook<TransferFormDto>(TransferFormSchema);
export type UseTransferFormReturnType = ReturnType<typeof useTransferForm>;

export const useCardPurchaseForm =
  formHook<CardPurchaseFormDto>(CardPurchaseFormSchema);
export type UseCardPurchaseFormReturnType = ReturnType<typeof useCardPurchaseForm>;

export const useCardPaymentForm = formHook<CardPaymentFormDto>(CardPaymentFormSchema);
export type UseCardPaymentFormReturnType = ReturnType<typeof useCardPaymentForm>;

export const useRecurringForm = formHook<RecurringFormDto>(RecurringFormSchema);
export type UseRecurringFormReturnType = ReturnType<typeof useRecurringForm>;

export const useBudgetForm = formHook<BudgetFormDto>(BudgetFormSchema);
export type UseBudgetFormReturnType = ReturnType<typeof useBudgetForm>;

/** One month of a budget series, edited on its own without touching the rest. */
export const useBudgetPeriodForm =
  formHook<BudgetPeriodFormDto>(BudgetPeriodFormSchema);
export type UseBudgetPeriodFormReturnType = ReturnType<typeof useBudgetPeriodForm>;

export const useProfileForm = formHook<ProfileFormDto>(ProfileFormSchema);
export type UseProfileFormReturnType = ReturnType<typeof useProfileForm>;

export const usePreferencesForm = formHook<PreferencesFormDto>(PreferencesFormSchema);
export type UsePreferencesFormReturnType = ReturnType<typeof usePreferencesForm>;

export const useLanguageForm = formHook<LanguageFormDto>(LanguageFormSchema);
export type UseLanguageFormReturnType = ReturnType<typeof useLanguageForm>;

export const useOnboardingPreferencesForm =
  formHook<OnboardingPreferencesFormDto>(OnboardingPreferencesFormSchema);
export type UseOnboardingPreferencesFormReturnType = ReturnType<
  typeof useOnboardingPreferencesForm
>;

export const EMPTY_PASSWORD_FORM: ChangePasswordFormDto = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** The one form with no defaults to be handed: it always starts empty. */
export function usePasswordForm({
  onSubmit,
}: {
  onSubmit: (values: ChangePasswordFormDto) => Promise<unknown>;
}) {
  return formHook<ChangePasswordFormDto>(ChangePasswordFormSchema)({
    onSubmit,
    defaultValues: EMPTY_PASSWORD_FORM,
  });
}

export type UsePasswordFormReturnType = ReturnType<typeof usePasswordForm>;
