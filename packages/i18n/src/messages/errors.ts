import type { MessageTable } from "./table";

/**
 * Two audiences in one namespace. `error.client.*` is copy the web app writes
 * itself; `error.notFound.*` and `error.conflict.*` are the domain errors
 * `packages/api` throws, which reach the user as a toast built from the
 * server's own message — so the server has to speak the caller's language, and
 * it does that by carrying these keys instead of a baked English string.
 */
export const errors = {
  "error.client.generic": {
    en: "Something went wrong. Please try again.",
    "pt-BR": "Algo deu errado. Tente novamente.",
  },
  "error.client.unauthorized": {
    en: "Your session expired. Please sign in again.",
    "pt-BR": "Sua sessão expirou. Entre novamente.",
  },
  "error.client.forbidden": {
    en: "You don't have permission to do that.",
    "pt-BR": "Você não tem permissão para fazer isso.",
  },
  "error.client.notFound": {
    en: "That item no longer exists.",
    "pt-BR": "Este item não existe mais.",
  },
  "error.client.timeout": {
    en: "The request took too long. Please try again.",
    "pt-BR": "A requisição demorou demais. Tente novamente.",
  },
  "error.client.tooManyRequests": {
    en: "Too many requests. Please wait a moment.",
    "pt-BR": "Muitas requisições. Aguarde um momento.",
  },

  "error.authenticationRequired": {
    en: "Authentication required",
    "pt-BR": "Autenticação necessária",
  },

  "error.notFound.wallet": { en: "Wallet not found", "pt-BR": "Carteira não encontrada" },
  "error.notFound.category": {
    en: "Category not found",
    "pt-BR": "Categoria não encontrada",
  },
  "error.notFound.creditCard": {
    en: "Credit card not found",
    "pt-BR": "Cartão de crédito não encontrado",
  },
  "error.notFound.bill": { en: "Bill not found", "pt-BR": "Fatura não encontrada" },
  "error.notFound.transaction": {
    en: "Transaction not found",
    "pt-BR": "Transação não encontrada",
  },
  "error.notFound.transfer": {
    en: "Transfer not found",
    "pt-BR": "Transferência não encontrada",
  },
  "error.notFound.cardPurchase": {
    en: "Card purchase not found",
    "pt-BR": "Compra no cartão não encontrada",
  },
  "error.notFound.cardPayment": {
    en: "Card payment not found",
    "pt-BR": "Pagamento de cartão não encontrado",
  },
  "error.notFound.recurring": {
    en: "Recurring transaction not found",
    "pt-BR": "Transação recorrente não encontrada",
  },

  "error.notFound.budget": {
    en: "Budget not found",
    "pt-BR": "Orçamento não encontrado",
  },
  "error.notFound.budgetPeriod": {
    en: "Budget month not found",
    "pt-BR": "Mês do orçamento não encontrado",
  },

  "error.conflict.walletInUse": {
    en: "This wallet is used by {references} record(s). Archive it instead of deleting.",
    "pt-BR":
      "Esta carteira é usada por {references} registro(s). Arquive-a em vez de excluí-la.",
  },
  "error.conflict.categoryInUse": {
    en: "This category is used by {references} record(s). Archive it instead of deleting.",
    "pt-BR":
      "Esta categoria é usada por {references} registro(s). Arquive-a em vez de excluí-la.",
  },
  "error.conflict.cardInUse": {
    en: "This card is used by {references} record(s). Archive it instead of deleting.",
    "pt-BR":
      "Este cartão é usado por {references} registro(s). Arquive-o em vez de excluí-lo.",
  },
  "error.conflict.categoryTypeInUse": {
    en: "This category is already used by {references} record(s), so it cannot switch between income and expense. Create a new category instead.",
    "pt-BR":
      "Esta categoria já é usada por {references} registro(s), então não pode alternar entre receita e despesa. Crie uma nova categoria.",
  },
  "error.conflict.walletCurrencyInUse": {
    en: "This wallet is already used by {references} record(s), so its currency can no longer change. Create a new wallet instead.",
    "pt-BR":
      "Esta carteira já é usada por {references} registro(s), então sua moeda não pode mais mudar. Crie uma nova carteira.",
  },
  "error.conflict.cardCurrencyInUse": {
    en: "This card is already used by {references} record(s), so its currency can no longer change. Create a new card instead.",
    "pt-BR":
      "Este cartão já é usado por {references} registro(s), então sua moeda não pode mais mudar. Crie um novo cartão.",
  },
  "error.conflict.billDifferentCard": {
    en: "That bill belongs to a different card.",
    "pt-BR": "Esta fatura pertence a outro cartão.",
  },
  "error.conflict.billingWalletCurrency": {
    en: "The billing wallet must use the card's currency. This card is {cardCurrency} and the wallet is {walletCurrency}.",
    "pt-BR":
      "A carteira de pagamento deve usar a moeda do cartão. Este cartão é {cardCurrency} e a carteira é {walletCurrency}.",
  },
  "error.conflict.paymentWalletCurrency": {
    en: "The wallet must use the card's currency. This card is {cardCurrency} and the wallet is {walletCurrency}.",
    "pt-BR":
      "A carteira deve usar a moeda do cartão. Este cartão é {cardCurrency} e a carteira é {walletCurrency}.",
  },
  "error.conflict.transferCurrencyMismatch": {
    en: "Both wallets must use the same currency. This transfer mixes {fromCurrency} and {toCurrency}.",
    "pt-BR":
      "As duas carteiras devem usar a mesma moeda. Esta transferência mistura {fromCurrency} e {toCurrency}.",
  },
  "error.conflict.cancelledCannotBePaid": {
    en: "This transaction is cancelled. Reopen it before marking it as paid.",
    "pt-BR":
      "Esta transação está cancelada. Reabra-a antes de marcá-la como paga.",
  },
  "error.conflict.transferLegEdit": {
    en: "This is one leg of a transfer. Edit the transfer instead.",
    "pt-BR":
      "Esta é uma das pernas de uma transferência. Edite a transferência.",
  },
  "error.conflict.cardRowEdit": {
    en: "This is a card transaction. Edit it as a card purchase or card payment instead.",
    "pt-BR":
      "Esta é uma transação de cartão. Edite-a como compra ou pagamento de cartão.",
  },
  "error.conflict.categoryOnCardPurchase": {
    en: "A {categoryType} category cannot be used on a card purchase.",
    "pt-BR":
      "Uma categoria de {categoryType} não pode ser usada em uma compra no cartão.",
  },
  "error.conflict.categoryOnTransaction": {
    en: "A {categoryType} category cannot be used on an {kind} transaction.",
    "pt-BR":
      "Uma categoria de {categoryType} não pode ser usada em uma transação de {kind}.",
  },
  "error.conflict.categoryOnSeries": {
    en: "A {categoryType} category cannot be used on a {kind} series.",
    "pt-BR":
      "Uma categoria de {categoryType} não pode ser usada em uma série de {kind}.",
  },
  "error.conflict.fixedInstallmentsNeedCount": {
    en: "Fixed installments need a count.",
    "pt-BR": "Parcelamento fixo precisa de uma quantidade.",
  },
  "error.conflict.cardPurchaseSeriesNeedsCard": {
    en: "A card purchase series needs a card.",
    "pt-BR": "Uma série de compras no cartão precisa de um cartão.",
  },
  "error.conflict.budgetAlreadyExists": {
    en: "This category already has a {currency} budget. Edit that one instead.",
    "pt-BR":
      "Esta categoria já tem um orçamento em {currency}. Edite esse orçamento.",
  },
  "error.conflict.budgetCategoryType": {
    en: "A {categoryType} category cannot carry a budget.",
    "pt-BR": "Uma categoria de {categoryType} não pode ter orçamento.",
  },
  "error.conflict.budgetCategoryArchived": {
    en: "That category is archived. Restore it before budgeting for it.",
    "pt-BR":
      "Esta categoria está arquivada. Restaure-a antes de criar um orçamento para ela.",
  },
  "error.conflict.budgetPeriodOrphaned": {
    en: "This month no longer belongs to a budget, so there is nothing to follow.",
    "pt-BR":
      "Este mês não pertence mais a um orçamento, então não há série a seguir.",
  },
  "error.conflict.seriesNeedsWallet": {
    en: "An income or expense series needs a wallet.",
    "pt-BR": "Uma série de receita ou despesa precisa de uma carteira.",
  },
} as const satisfies MessageTable;
