/**
 * Everything shared that needs React: the query and mutation hooks for every module,
 * the form hooks, and the two small utility hooks. Kept on a subpath so the root entry
 * stays importable by anything — including a test with no renderer.
 *
 * A hook here reads the tRPC proxy through `api()`, which an app installs once with
 * `createClientRuntime` (`@budget-manager/client/runtime`). That is what lets the web app
 * and the phone share the *whole* data layer rather than a copy each: the invalidation
 * lists in particular encode which joins a mutation moves, and two copies of those are
 * two chances for a rename to linger in one screen.
 */
export { type EnumLabels, useEnumLabels } from "./enum-labels";
export {
  EMPTY_PASSWORD_FORM,
  fieldErrors,
  FORM_VALIDATION_LOGIC,
  isFieldInvalid,
  useBudgetForm,
  type UseBudgetFormReturnType,
  useBudgetPeriodForm,
  type UseBudgetPeriodFormReturnType,
  useCardPaymentForm,
  type UseCardPaymentFormReturnType,
  useCardPurchaseForm,
  type UseCardPurchaseFormReturnType,
  useCategoryForm,
  type UseCategoryFormReturnType,
  useCreditCardForm,
  type UseCreditCardFormReturnType,
  useLanguageForm,
  type UseLanguageFormReturnType,
  usePasswordForm,
  type UsePasswordFormReturnType,
  usePreferencesForm,
  type UsePreferencesFormReturnType,
  useProfileForm,
  type UseProfileFormReturnType,
  useRecurringForm,
  type UseRecurringFormReturnType,
  useTransactionForm,
  type UseTransactionFormReturnType,
  useTransferForm,
  type UseTransferFormReturnType,
  useWalletForm,
  type UseWalletFormReturnType,
} from "./forms";
export * from "./hooks/budget";
export * from "./hooks/category";
export * from "./hooks/credit-card";
export * from "./hooks/dashboard";
export * from "./hooks/recurring";
export * from "./hooks/session";
export * from "./hooks/settings";
export * from "./hooks/transaction";
export * from "./hooks/wallet";
export { useApiMutation } from "./use-api-mutation";
export { usePagedFilters } from "./use-paged-filters";
