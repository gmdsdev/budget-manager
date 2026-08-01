import type { MessageTable } from "./table";

/**
 * The Zod messages in `@budget-manager/schemas`. They reach the screen through
 * two paths — the client-side form validator and, if a request ever bypasses
 * it, the server's `zodError` payload — so the English wording here is the
 * wording the e2e suite asserts on. Do not reword it without updating
 * `apps/e2e`.
 */
export const validation = {
  "validation.nameRequired": {
    en: "Name is required",
    "pt-BR": "O nome é obrigatório",
  },
  "validation.nameTooLong": {
    en: "Name must be {max} characters or fewer",
    "pt-BR": "O nome deve ter no máximo {max} caracteres",
  },
  "validation.notesTooLong": {
    en: "Notes must be {max} characters or fewer",
    "pt-BR": "As observações devem ter no máximo {max} caracteres",
  },
  "validation.wholeNumber": {
    en: "Must be a whole number",
    "pt-BR": "Deve ser um número inteiro",
  },
  "validation.amountGreaterThanZero": {
    en: "Amount must be greater than zero",
    "pt-BR": "O valor deve ser maior que zero",
  },
  "validation.limitGreaterThanZero": {
    en: "Limit must be greater than zero",
    "pt-BR": "O limite deve ser maior que zero",
  },
  "validation.cycleDayRange": {
    en: "Must be between {min} and {max}",
    "pt-BR": "Deve estar entre {min} e {max}",
  },
  "validation.atLeast": {
    en: "Must be at least {min}",
    "pt-BR": "Deve ser no mínimo {min}",
  },
  "validation.atMost": {
    en: "Must be {max} or fewer",
    "pt-BR": "Deve ser no máximo {max}",
  },
  "validation.dateRequired": {
    en: "Date is required",
    "pt-BR": "A data é obrigatória",
  },
  "validation.startDateRequired": {
    en: "Start date is required",
    "pt-BR": "A data de início é obrigatória",
  },
  "validation.walletRequired": {
    en: "Wallet is required",
    "pt-BR": "A carteira é obrigatória",
  },
  "validation.sourceWalletRequired": {
    en: "Source wallet is required",
    "pt-BR": "A carteira de origem é obrigatória",
  },
  "validation.destinationWalletRequired": {
    en: "Destination wallet is required",
    "pt-BR": "A carteira de destino é obrigatória",
  },
  "validation.cardRequired": {
    en: "Card is required",
    "pt-BR": "O cartão é obrigatório",
  },
  "validation.sameWalletTransfer": {
    en: "Source and destination wallets must be different",
    "pt-BR": "As carteiras de origem e destino devem ser diferentes",
  },
  "validation.recurringAccount": {
    en: "Pick a wallet for income and expenses, or a card for card purchases",
    "pt-BR":
      "Escolha uma carteira para receitas e despesas, ou um cartão para compras no cartão",
  },
  "validation.recurringInstallments": {
    en: "Fixed installments need a count",
    "pt-BR": "Parcelamento fixo precisa de uma quantidade",
  },
  "validation.monthRequired": {
    en: "Pick a month",
    "pt-BR": "Escolha um mês",
  },
  "validation.categoryRequired": {
    en: "Category is required",
    "pt-BR": "A categoria é obrigatória",
  },
  "validation.budgetInstallments": {
    en: "A fixed budget needs a number of months",
    "pt-BR": "Um orçamento fixo precisa de uma quantidade de meses",
  },
  "validation.currentPasswordRequired": {
    en: "Current password is required",
    "pt-BR": "A senha atual é obrigatória",
  },
  "validation.confirmYourNewPassword": {
    en: "Confirm your new password",
    "pt-BR": "Confirme a nova senha",
  },
  "validation.passwordTooShort": {
    en: "Password must be at least {min} characters",
    "pt-BR": "A senha deve ter pelo menos {min} caracteres",
  },
  "validation.passwordTooLong": {
    en: "Password must be {max} characters or fewer",
    "pt-BR": "A senha deve ter no máximo {max} caracteres",
  },
  "validation.newPasswordMustDiffer": {
    en: "New password must be different from the current one",
    "pt-BR": "A nova senha deve ser diferente da atual",
  },
  "validation.passwordsDoNotMatch": {
    en: "Passwords do not match",
    "pt-BR": "As senhas não coincidem",
  },
  "validation.invalidEmail": {
    en: "Invalid email address",
    "pt-BR": "Endereço de e-mail inválido",
  },
} as const satisfies MessageTable;
