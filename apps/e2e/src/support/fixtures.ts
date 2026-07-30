import {
  CategoryType,
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
  WalletCurrency,
  WalletType,
  type CardPaymentFormDto,
  type CardPurchaseFormDto,
  type CreditCardFormDto,
  type RecurringFormDto,
  type TransactionFormDto,
  type TransferFormDto,
  type WalletFormDto,
} from "@budget-manager/schemas";
import type { ApiClient } from "./api";

export const wallet = (
  overrides: Partial<WalletFormDto> = {},
): WalletFormDto => ({
  name: "Checking",
  type: WalletType.CHECKING,
  currencyCode: WalletCurrency.BRL,
  openingBalanceCents: 100_000,
  ...overrides,
});

export const transaction = (
  walletId: string,
  overrides: Partial<TransactionFormDto> = {},
): TransactionFormDto => ({
  kind: TransactionKind.EXPENSE,
  status: TransactionStatus.PAID,
  name: "Supermarket",
  amountCents: 25_000,
  occurrenceDate: "2026-07-05",
  walletId,
  categoryId: null,
  notes: null,
  ...overrides,
});

export const card = (
  overrides: Partial<CreditCardFormDto> = {},
): CreditCardFormDto => ({
  name: "Visa",
  limitCents: 500_000,
  closeDay: 10,
  dueDay: 20,
  defaultBillingWalletId: null,
  currencyCode: WalletCurrency.BRL,
  ...overrides,
});

export const cardPurchase = (
  creditCardId: string,
  overrides: Partial<CardPurchaseFormDto> = {},
): CardPurchaseFormDto => ({
  status: TransactionStatus.PAID,
  name: "Card purchase",
  amountCents: 30_000,
  occurrenceDate: "2026-07-05",
  creditCardId,
  categoryId: null,
  notes: null,
  ...overrides,
});

export const cardPayment = (
  creditCardId: string,
  walletId: string,
  overrides: Partial<CardPaymentFormDto> = {},
): CardPaymentFormDto => ({
  status: TransactionStatus.PAID,
  name: "Card bill",
  amountCents: 30_000,
  occurrenceDate: "2026-07-20",
  creditCardId,
  walletId,
  creditCardBillId: null,
  notes: null,
  ...overrides,
});

export const recurring = (
  overrides: Partial<RecurringFormDto> = {},
): RecurringFormDto => ({
  kind: TransactionKind.EXPENSE,
  name: "Subscription",
  amountCents: 10_000,
  categoryId: null,
  walletId: null,
  creditCardId: null,
  notes: null,
  recurrenceType: RecurrenceType.MONTHLY,
  interval: 1,
  installments: null,
  startsOn: "2026-07-05",
  endsOn: "2026-10-05",
  ...overrides,
});

export const transfer = (
  fromWalletId: string,
  toWalletId: string,
  overrides: Partial<TransferFormDto> = {},
): TransferFormDto => ({
  status: TransactionStatus.PAID,
  name: "To savings",
  amountCents: 30_000,
  occurrenceDate: "2026-07-15",
  fromWalletId,
  toWalletId,
  notes: null,
  ...overrides,
});

/**
 * A day in the month the suite happens to run in, capped at 28 so it exists in
 * every month. Rows the transaction list must show without touching its filters
 * have to be dated here, since that list always scopes itself to a date range.
 */
export function dayThisMonth(day: number, today = new Date()) {
  const month = `${today.getMonth() + 1}`.padStart(2, "0");

  return `${today.getFullYear()}-${month}-${`${Math.min(day, 28)}`.padStart(2, "0")}`;
}

export function dayLastMonth(day: number, today = new Date()) {
  return dayThisMonth(day, new Date(today.getFullYear(), today.getMonth() - 1, 1));
}

/** The common starting point: two same-currency wallets and both category types. */
export async function seedBasics(client: ApiClient) {
  const [checking, savings, salary, groceries] = await Promise.all([
    client.wallet.create.mutate(wallet({ name: "Checking" })),
    client.wallet.create.mutate(
      wallet({
        name: "Savings",
        type: WalletType.SAVINGS,
        openingBalanceCents: 0,
      }),
    ),
    client.category.create.mutate({
      name: "Salary",
      type: CategoryType.INCOME,
    }),
    client.category.create.mutate({
      name: "Groceries",
      type: CategoryType.EXPENSE,
    }),
  ]);

  return { checking, savings, salary, groceries };
}

type WalletListInput = Parameters<ApiClient["wallet"]["getAll"]["query"]>[0];
type CategoryListInput = Parameters<
  ApiClient["category"]["getAll"]["query"]
>[0];
type TransactionListInput = Parameters<
  ApiClient["transaction"]["getAll"]["query"]
>[0];

/**
 * The list endpoints return a paginated envelope; these unwrap it so tests that
 * are about rows stay readable. Envelope fields are asserted in
 * `pagination.test.ts`.
 */
export async function listWallets(
  client: ApiClient,
  input: WalletListInput = {},
) {
  return (await client.wallet.getAll.query(input)).rows;
}

export async function listCategories(
  client: ApiClient,
  input: CategoryListInput = {},
) {
  return (await client.category.getAll.query(input)).rows;
}

export async function listTransactions(
  client: ApiClient,
  input: TransactionListInput = {},
) {
  return (await client.transaction.getAll.query(input)).rows;
}

export async function balanceOf(client: ApiClient, walletId: string) {
  const wallets = await listWallets(client);
  const row = wallets.find((w) => w.id === walletId);

  if (!row) throw new Error(`wallet ${walletId} not in list`);

  return { settled: row.balanceCents, projected: row.projectedBalanceCents };
}
