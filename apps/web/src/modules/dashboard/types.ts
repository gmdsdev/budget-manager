import type { BudgetStatus, CategoryColor } from "@budget-manager/schemas";

export type MonthPoint = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
};

export type CategorySpend = {
  categoryId: string | null;
  name: string;
  color: CategoryColor | null;
  amountCents: number;
};

export type WalletSlice = {
  id: string;
  name: string;
  balanceCents: number;
  projectedBalanceCents: number;
};

export type CardSlice = {
  id: string;
  name: string;
  limitCents: number;
  outstandingCents: number;
  availableCents: number;
};

export type BudgetProgress = {
  periodId: string;
  budgetId: string | null;
  categoryId: string;
  categoryName: string;
  categoryColor: CategoryColor;
  currencyCode: string;
  periodMonth: string;
  limitCents: number;
  spentCents: number;
  projectedSpentCents: number;
  remainingCents: number;
  usedRatio: number;
  status: BudgetStatus;
  isOverride: boolean;
};

export type BudgetTotals = {
  currencyCode: string;
  budgetCount: number;
  limitCents: number;
  spentCents: number;
  projectedSpentCents: number;
  remainingCents: number;
  exceededCount: number;
};

export type CurrencySummary = {
  currencyCode: string;
  budgets: BudgetProgress[];
  budgetTotals: BudgetTotals | null;
  walletCount: number;
  balanceCents: number;
  projectedBalanceCents: number;
  cardCount: number;
  cardOutstandingCents: number;
  cardAvailableCents: number;
  netWorthCents: number;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  topCategories: CategorySpend[];
  trend: MonthPoint[];
  wallets: WalletSlice[];
  cards: CardSlice[];
};

export type PendingItem = {
  id: string;
  name: string;
  kind: string;
  amountCents: number;
  occurrenceDate: string;
  walletName: string | null;
  creditCardName: string | null;
  walletCurrencyCode: string;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
};

export type StatementDue = {
  id: string;
  creditCardId: string;
  creditCardName: string;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  closeAt: string;
  dueAt: string;
  statementTotalCents: number;
  paidCents: number;
  remainingCents: number;
  status: string;
};
