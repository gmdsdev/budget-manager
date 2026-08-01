import { minorUnitDigits } from "@budget-manager/money";
import {
  RecurrenceType,
  TransactionKind,
  TransactionStatus,
  WalletCurrency,
} from "@budget-manager/schemas";
import { createCalendar } from "./calendar";
import {
  BUDGETS,
  CARDS,
  CARD_SPENDING,
  CUSTOM_CATEGORIES,
  EXTRA_INCOME,
  MONTHLY_TRANSFERS,
  OVERDUE_ONE_OFFS,
  SALARY_MAJOR,
  SCHEDULED_ONE_OFFS,
  SERIES,
  VARIABLE_BILLS,
  WALLETS,
  WALLET_SPENDING,
  type CardKey,
  type WalletKey,
} from "./catalog";
import type { ApiClient } from "./client";
import type { SeedConfig } from "./config";
import { createRandom } from "./random";

/** Enough parallelism for `httpBatchLink` to batch, low enough to keep the
 * server log readable. */
const CONCURRENCY = 6;
const PAGE_SIZE = 100;

/** How much of the newest closed statement is covered, so the account also has
 * a bill caught mid-payment instead of a clean run of settled ones. */
const PARTIAL_PAYMENT_SHARE = 0.6;

export type Tally = Record<string, number>;

async function inBatches<T>(
  items: readonly T[],
  worker: (item: T) => Promise<unknown>,
) {
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    await Promise.all(items.slice(index, index + CONCURRENCY).map(worker));
  }

  return items.length;
}

export async function seedDemoAccount({
  client,
  config,
  log,
}: {
  client: ApiClient;
  config: SeedConfig;
  log: (message: string) => void;
}) {
  const now = new Date();
  const calendar = createCalendar(now);
  const random = createRandom(config.randomSeed);
  const tally: Tally = {};

  const count = (key: string, amount: number) => {
    tally[key] = (tally[key] ?? 0) + amount;
  };

  /** Major units → minor units, through the app's own per-currency digits. */
  const minor = (major: number, currencyCode: WalletCurrency) =>
    Math.round(major * 10 ** minorUnitDigits(currencyCode));

  /** A jittered amount inside a major-unit range, in minor units. */
  const minorBetween = (
    [min, max]: readonly [number, number],
    currencyCode: WalletCurrency,
  ) => random.intBetween(minor(min, currencyCode), minor(max, currencyCode));

  const { pastMonths } = config;
  const history = calendar.monthOffsets(pastMonths, 0);

  /** A day in the month at `offset`, never later than today. */
  const dayInPast = (offset: number, day: number) =>
    calendar.dayIn(offset, offset === 0 ? Math.min(day, now.getDate()) : day);

  const randomPastDay = (offset: number) =>
    dayInPast(offset, random.intBetween(1, offset === 0 ? now.getDate() : 28));

  // --- Categories -----------------------------------------------------------

  log("Creating custom categories…");

  for (const category of CUSTOM_CATEGORIES) {
    await client.category.create.mutate(category);
    count("categories", 1);
  }

  // The default set arrives with the account (better-auth's `user.create` hook
  // runs `ensureDefaultCategories`), so it is read back rather than written.
  const categoryOptions = await client.category.options.query({});
  const categoryIds = new Map<string, string>();

  for (const option of categoryOptions) {
    const key = option.name.trim().toLowerCase();

    if (categoryIds.has(key)) {
      throw new Error(`Two categories share the name "${option.name}"`);
    }

    categoryIds.set(key, option.id);
  }

  const categoryId = (name: string) => {
    const id = categoryIds.get(name.trim().toLowerCase());

    if (!id) {
      throw new Error(
        `No category named "${name}". Available: ${[...categoryIds.keys()].join(", ")}`,
      );
    }

    return id;
  };

  // --- Wallets and cards ----------------------------------------------------

  log("Creating wallets…");

  const walletIds = {} as Record<WalletKey, string>;
  const walletCurrencies = {} as Record<WalletKey, WalletCurrency>;

  for (const key of Object.keys(WALLETS) as WalletKey[]) {
    const spec = WALLETS[key];
    const created = await client.wallet.create.mutate({
      name: spec.name,
      type: spec.type,
      currencyCode: spec.currencyCode,
      openingBalanceCents: minor(spec.openingBalanceMajor, spec.currencyCode),
    });

    walletIds[key] = created.id;
    walletCurrencies[key] = spec.currencyCode;
    count("wallets", 1);
  }

  log("Creating credit cards…");

  const cardIds = {} as Record<CardKey, string>;

  for (const key of Object.keys(CARDS) as CardKey[]) {
    const spec = CARDS[key];
    const created = await client.creditCard.create.mutate({
      name: spec.name,
      limitCents: minor(spec.limitMajor, spec.currencyCode),
      closeDay: spec.closeDay,
      dueDay: spec.dueDay,
      currencyCode: spec.currencyCode,
      defaultBillingWalletId: walletIds[spec.billingWallet],
    });

    cardIds[key] = created.id;
    count("cards", 1);
  }

  // --- Recurring series -----------------------------------------------------

  // First, because one `recurring.create` materializes both its history and the
  // next 12 months; the one-offs then fill in around them.
  log("Creating recurring series…");

  for (const series of SERIES) {
    const currency = series.card
      ? CARDS[series.card].currencyCode
      : walletCurrencies[series.wallet ?? "checking"];

    const created = await client.recurring.create.mutate({
      kind: series.kind,
      name: series.name,
      amountCents: minor(series.amountMajor, currency),
      categoryId: categoryId(series.category),
      walletId: series.wallet ? walletIds[series.wallet] : null,
      creditCardId: series.card ? cardIds[series.card] : null,
      notes: series.notes ?? null,
      recurrenceType: series.recurrenceType,
      interval: series.interval,
      installments: series.installments,
      startsOn: calendar.dayIn(
        -Math.min(series.startsAgo, pastMonths),
        series.day,
      ),
    });

    count("series", 1);
    count("seriesOccurrences", created.generated);

    if (series.paused) {
      const paused = await client.recurring.setActive.mutate({
        id: created.id,
        isActive: false,
      });

      count("seriesOccurrences", -paused.removed);
      count("pausedSeries", 1);
    }
  }

  // --- Wallet transactions --------------------------------------------------

  log("Recording the past year of wallet transactions…");

  const plainRows: {
    kind: TransactionKind.INCOME | TransactionKind.EXPENSE;
    name: string;
    category: string;
    wallet: WalletKey;
    amountCents: number;
    date: string;
  }[] = [];

  for (const offset of history) {
    for (const group of WALLET_SPENDING) {
      const wallet = group.wallet ?? "checking";

      for (let index = random.intBetween(...group.perMonth); index > 0; index--) {
        plainRows.push({
          kind: TransactionKind.EXPENSE,
          name: random.pick(group.merchants),
          category: group.category,
          wallet,
          amountCents: minorBetween(group.amount, walletCurrencies[wallet]),
          date: randomPastDay(offset),
        });
      }
    }

    for (const bill of VARIABLE_BILLS) {
      plainRows.push({
        kind: TransactionKind.EXPENSE,
        name: bill.name,
        category: bill.category,
        wallet: bill.wallet,
        amountCents: minorBetween(bill.amount, walletCurrencies[bill.wallet]),
        date: dayInPast(offset, bill.day),
      });
    }

    for (const income of EXTRA_INCOME) {
      if (!random.chance(income.chance)) {
        continue;
      }

      plainRows.push({
        kind: TransactionKind.INCOME,
        name: income.name,
        category: income.category,
        wallet: income.wallet,
        amountCents: minorBetween(
          income.amount,
          walletCurrencies[income.wallet],
        ),
        date: randomPastDay(offset),
      });
    }

    // The thirteenth salary, which is what makes December stand out on the
    // cash-flow chart.
    if (calendar.monthKey(offset).endsWith("-12")) {
      plainRows.push({
        kind: TransactionKind.INCOME,
        name: "13º salário",
        category: "Bonus",
        wallet: "checking",
        amountCents: minor(SALARY_MAJOR, walletCurrencies.checking),
        date: dayInPast(offset, 20),
      });
    }
  }

  for (const scheduled of SCHEDULED_ONE_OFFS) {
    if (scheduled.monthsAhead > config.futureMonths) {
      continue;
    }

    plainRows.push({
      kind: TransactionKind.EXPENSE,
      name: scheduled.name,
      category: scheduled.category,
      wallet: scheduled.wallet,
      amountCents: minor(
        scheduled.amountMajor,
        walletCurrencies[scheduled.wallet],
      ),
      date: calendar.dayIn(scheduled.monthsAhead, scheduled.day),
    });
  }

  count(
    "transactions",
    await inBatches(plainRows, async (row) => {
      await client.transaction.create.mutate({
        kind: row.kind,
        status: calendar.statusFor(row.date),
        name: row.name,
        amountCents: row.amountCents,
        occurrenceDate: row.date,
        walletId: walletIds[row.wallet],
        categoryId: categoryId(row.category),
        notes: null,
      });
    }),
  );

  // --- Transfers ------------------------------------------------------------

  log("Recording transfers between wallets…");

  const transferRows = [
    ...history.flatMap((offset) =>
      MONTHLY_TRANSFERS.map((transfer) => ({
        transfer,
        date: dayInPast(offset, transfer.day),
      })),
    ),
    // One still to happen, so the list is not all history.
    ...MONTHLY_TRANSFERS.slice(0, 1).map((transfer) => ({
      transfer,
      date: calendar.dayIn(Math.min(1, config.futureMonths), transfer.day),
    })),
  ];

  count(
    "transfers",
    await inBatches(transferRows, async ({ transfer, date }) => {
      await client.transaction.createTransfer.mutate({
        status: calendar.statusFor(date),
        name: transfer.name,
        amountCents: minorBetween(
          transfer.amount,
          walletCurrencies[transfer.from],
        ),
        occurrenceDate: date,
        fromWalletId: walletIds[transfer.from],
        toWalletId: walletIds[transfer.to],
        notes: null,
      });
    }),
  );

  // --- Card purchases -------------------------------------------------------

  log("Recording card purchases…");

  const purchaseRows: {
    card: CardKey;
    name: string;
    category: string;
    amountCents: number;
    date: string;
  }[] = [];

  for (const offset of calendar.monthOffsets(
    pastMonths,
    Math.min(1, config.futureMonths),
  )) {
    for (const group of CARD_SPENDING) {
      for (let index = random.intBetween(...group.perMonth); index > 0; index--) {
        const day = random.intBetween(1, 28);

        purchaseRows.push({
          card: group.card,
          name: random.pick(group.merchants),
          category: group.category,
          amountCents: minorBetween(
            group.amount,
            CARDS[group.card].currencyCode,
          ),
          date:
            offset <= 0 ? dayInPast(offset, day) : calendar.dayIn(offset, day),
        });
      }
    }
  }

  count(
    "cardPurchases",
    await inBatches(purchaseRows, async (row) => {
      await client.transaction.createCardPurchase.mutate({
        status: calendar.statusFor(row.date),
        name: row.name,
        amountCents: row.amountCents,
        occurrenceDate: row.date,
        creditCardId: cardIds[row.card],
        categoryId: categoryId(row.category),
        notes: null,
      });
    }),
  );

  // --- Settling what already happened ---------------------------------------

  // A generated occurrence is always written as waiting, even one dated last
  // year, so a series' own history has to be settled the way a user would.
  log("Settling past occurrences of the recurring series…");

  const pendingIds: string[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await client.transaction.getAll.query({
      status: TransactionStatus.WAITING_PAYMENT,
      dateFrom: calendar.dayIn(-Math.max(pastMonths, 12) - 1, 1),
      dateTo: calendar.today,
      limit: PAGE_SIZE,
      offset,
    });

    pendingIds.push(...page.rows.map((row) => row.id));

    if (offset + PAGE_SIZE >= page.total) {
      break;
    }
  }

  count(
    "markedPaid",
    await inBatches(pendingIds, async (id) => {
      await client.transaction.markPaid.mutate({ id });
    }),
  );

  // Written after that sweep so they stay overdue instead of being settled by it.
  log("Leaving a few overdue rows behind…");

  count(
    "overdue",
    await inBatches(OVERDUE_ONE_OFFS, async (row) => {
      await client.transaction.create.mutate({
        kind: TransactionKind.EXPENSE,
        status: TransactionStatus.WAITING_PAYMENT,
        name: row.name,
        amountCents: minor(row.amountMajor, walletCurrencies[row.wallet]),
        occurrenceDate: dayInPast(-row.monthsAgo, row.day),
        walletId: walletIds[row.wallet],
        categoryId: categoryId(row.category),
        notes: null,
      });
    }),
  );

  await client.transaction.create.mutate({
    kind: TransactionKind.EXPENSE,
    status: TransactionStatus.CANCELLED,
    name: "Assinatura cancelada antes da cobrança",
    amountCents: minor(89.9, walletCurrencies.checking),
    occurrenceDate: randomPastDay(-1),
    walletId: walletIds.checking,
    categoryId: categoryId("Subscriptions"),
    notes: "Cancelada, não entra em nenhum total",
  });

  count("cancelled", 1);

  // --- Budgets --------------------------------------------------------------

  // Anchored at the oldest month of history, so every seeded month already has
  // a limit to read against rather than only the months ahead.
  log("Setting monthly budgets…");

  count(
    "budgets",
    await inBatches(BUDGETS, async (spec) => {
      await client.budget.create.mutate({
        categoryId: categoryId(spec.category),
        currencyCode: WalletCurrency.BRL,
        amountCents: minor(spec.limitMajor, WalletCurrency.BRL),
        recurrenceType: RecurrenceType.MONTHLY,
        interval: spec.everyMonths ?? 1,
        installments: null,
        startsOn: calendar.monthKey(-pastMonths),
      });
    }),
  );

  // --- Paying the card bills ------------------------------------------------

  // Last, because a statement's total is summed from the purchases linked to it:
  // paying before they all exist would settle the wrong figure.
  log("Paying the closed card bills…");

  for (const key of Object.keys(CARDS) as CardKey[]) {
    const spec = CARDS[key];
    const bills = await client.creditCard.bills.query({
      creditCardId: cardIds[key],
      limit: PAGE_SIZE,
      offset: 0,
    });

    const payments = bills.rows
      .filter(
        (bill) =>
          bill.remainingCents > 0 &&
          bill.closeAt < calendar.today &&
          bill.dueAt <= calendar.today,
      )
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt))
      .map((bill, index, all) => {
        const isPartial = index === all.length - 1;

        return {
          bill,
          isPartial,
          amountCents: isPartial
            ? Math.round(bill.remainingCents * PARTIAL_PAYMENT_SHARE)
            : bill.remainingCents,
        };
      })
      .filter((payment) => payment.amountCents > 0);

    count(
      "billPayments",
      await inBatches(payments, async ({ bill, isPartial, amountCents }) => {
        await client.transaction.createCardPayment.mutate({
          status: TransactionStatus.PAID,
          name: `${spec.name} - fatura ${bill.periodEnd.slice(0, 7)}`,
          amountCents,
          occurrenceDate: bill.dueAt,
          creditCardId: cardIds[key],
          walletId: bill.billingWalletId ?? walletIds[spec.billingWallet],
          creditCardBillId: bill.id,
          notes: isPartial ? "Pagamento parcial" : null,
        });
      }),
    );
  }

  return tally;
}
