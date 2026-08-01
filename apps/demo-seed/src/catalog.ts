import {
  CategoryColor,
  CategoryType,
  RecurrenceType,
  TransactionKind,
  WalletCurrency,
  WalletType,
} from "@budget-manager/schemas";

/**
 * The figure the whole account is balanced around: the monthly spending below
 * plus the transfers out of the checking wallet have to leave a small surplus,
 * or a year of history ends with a demo account deep in the red.
 */
export const SALARY_MAJOR = 12_800;

/** Which of the account's wallets a row belongs to. Keys, not ids: the ids only
 * exist once the wallets are created. */
export type WalletKey = "checking" | "savings" | "cash" | "investments" | "usd";

export type CardKey = "mastercard" | "visa" | "amex";

export const WALLETS: Record<
  WalletKey,
  {
    name: string;
    type: WalletType;
    currencyCode: WalletCurrency;
    openingBalanceMajor: number;
  }
> = {
  checking: {
    name: "Nubank Checking",
    type: WalletType.CHECKING,
    currencyCode: WalletCurrency.BRL,
    openingBalanceMajor: 4_500,
  },
  savings: {
    name: "Itaú Savings",
    type: WalletType.SAVINGS,
    currencyCode: WalletCurrency.BRL,
    openingBalanceMajor: 18_000,
  },
  cash: {
    name: "Cash",
    type: WalletType.CASH,
    currencyCode: WalletCurrency.BRL,
    openingBalanceMajor: 320,
  },
  investments: {
    name: "XP Investments",
    type: WalletType.INVESTMENTS,
    currencyCode: WalletCurrency.BRL,
    openingBalanceMajor: 26_400,
  },
  usd: {
    name: "Payoneer USD",
    type: WalletType.CHECKING,
    currencyCode: WalletCurrency.USD,
    openingBalanceMajor: 2_400,
  },
};

/** Cycle days stay inside 1–28, which is what `CYCLE_DAY_MAX` requires. */
export const CARDS: Record<
  CardKey,
  {
    name: string;
    limitMajor: number;
    closeDay: number;
    dueDay: number;
    currencyCode: WalletCurrency;
    billingWallet: WalletKey;
  }
> = {
  mastercard: {
    name: "Nubank Mastercard",
    limitMajor: 8_000,
    closeDay: 25,
    dueDay: 5,
    currencyCode: WalletCurrency.BRL,
    billingWallet: "checking",
  },
  visa: {
    name: "Itaú Visa Infinite",
    limitMajor: 15_000,
    closeDay: 10,
    dueDay: 20,
    currencyCode: WalletCurrency.BRL,
    billingWallet: "checking",
  },
  amex: {
    name: "Amex Gold USD",
    limitMajor: 5_000,
    closeDay: 15,
    dueDay: 25,
    currencyCode: WalletCurrency.USD,
    billingWallet: "usd",
  },
};

/** Two categories the default set does not ship, so the account also exercises
 * the ones a user creates. */
export const CUSTOM_CATEGORIES = [
  {
    name: "Coworking",
    type: CategoryType.EXPENSE,
    color: CategoryColor.PURPLE,
  },
  {
    name: "Dividends",
    type: CategoryType.INCOME,
    color: CategoryColor.CYAN,
  },
] as const;

export type SpendGroup = {
  /** Category name; resolved against the account's own categories. */
  category: string;
  merchants: readonly string[];
  /** Amount range in major units. */
  amount: readonly [number, number];
  /** How many of these land in a month. */
  perMonth: readonly [number, number];
  wallet?: WalletKey;
};

export const WALLET_SPENDING: readonly SpendGroup[] = [
  {
    category: "Groceries",
    merchants: [
      "Supermercado Pão de Açúcar",
      "Mercado Extra",
      "Hortifruti da Praça",
      "Supermercado Dia",
    ],
    amount: [90, 430],
    perMonth: [2, 4],
    wallet: "checking",
  },
  {
    category: "Groceries",
    merchants: ["Feira da Vila Mariana", "Padaria do Bairro"],
    amount: [25, 110],
    perMonth: [1, 3],
    wallet: "cash",
  },
  {
    category: "Dining Out",
    merchants: [
      "Sushi Yama",
      "Cantina do Zé",
      "Burger Joint",
      "Café Cultura",
      "Pizzaria Bráz",
    ],
    amount: [38, 210],
    perMonth: [2, 5],
    wallet: "checking",
  },
  {
    category: "Transportation",
    merchants: ["Uber", "99 Pop", "Bilhete Único"],
    amount: [18, 75],
    perMonth: [2, 4],
    wallet: "checking",
  },
  {
    category: "Fuel",
    merchants: ["Posto Ipiranga", "Shell Select", "Posto BR"],
    amount: [180, 340],
    perMonth: [1, 2],
    wallet: "checking",
  },
  {
    category: "Health",
    merchants: ["Drogasil", "Droga Raia", "Laboratório Fleury"],
    amount: [42, 260],
    perMonth: [0, 2],
    wallet: "checking",
  },
  {
    category: "Personal Care",
    merchants: ["Barbearia Central", "Salão Studio W"],
    amount: [45, 130],
    perMonth: [0, 2],
    wallet: "cash",
  },
  {
    category: "Entertainment",
    merchants: ["Cinemark", "Teatro Municipal", "Show no Audio"],
    amount: [50, 240],
    perMonth: [0, 2],
    wallet: "checking",
  },
  {
    category: "Coworking",
    merchants: ["Coworking Nexo"],
    amount: [320, 420],
    perMonth: [0, 1],
    wallet: "checking",
  },
];

/** Bills whose amount moves every month, so they are one-offs rather than a
 * series: a fixed-amount rule would misreport every one of them. */
export const VARIABLE_BILLS: readonly {
  name: string;
  category: string;
  amount: readonly [number, number];
  day: number;
  wallet: WalletKey;
}[] = [
  {
    name: "Enel - Energia elétrica",
    category: "Utilities",
    amount: [128, 275],
    day: 14,
    wallet: "checking",
  },
  {
    name: "Sabesp - Água",
    category: "Utilities",
    amount: [58, 124],
    day: 16,
    wallet: "checking",
  },
  {
    name: "Condomínio",
    category: "Home",
    amount: [640, 720],
    day: 12,
    wallet: "checking",
  },
];

export const EXTRA_INCOME: readonly {
  name: string;
  category: string;
  amount: readonly [number, number];
  chance: number;
  wallet: WalletKey;
}[] = [
  {
    name: "Freelance - Landing page",
    category: "Freelance",
    amount: [900, 2_600],
    chance: 0.35,
    wallet: "checking",
  },
  {
    name: "Dividendos - FIIs",
    category: "Dividends",
    amount: [120, 480],
    chance: 0.8,
    wallet: "investments",
  },
  {
    name: "Reembolso - plano de saúde",
    category: "Refunds",
    amount: [80, 320],
    chance: 0.25,
    wallet: "checking",
  },
];

export const CARD_SPENDING: readonly (SpendGroup & { card: CardKey })[] = [
  {
    card: "mastercard",
    category: "Shopping",
    merchants: ["Amazon.com.br", "Magazine Luiza", "Renner", "Zara"],
    amount: [70, 520],
    perMonth: [1, 2],
  },
  {
    card: "mastercard",
    category: "Dining Out",
    merchants: ["iFood", "Rappi", "Outback Steakhouse"],
    amount: [40, 190],
    perMonth: [2, 3],
  },
  {
    card: "mastercard",
    category: "Pets",
    merchants: ["Petz", "Clínica Veterinária Animália"],
    amount: [60, 420],
    perMonth: [0, 1],
  },
  {
    card: "visa",
    category: "Travel",
    merchants: ["LATAM Airlines", "Booking.com", "Airbnb"],
    amount: [300, 1_100],
    perMonth: [0, 1],
  },
  {
    card: "visa",
    category: "Home",
    merchants: ["Leroy Merlin", "Tok&Stok", "Casa & Construção"],
    amount: [110, 460],
    perMonth: [0, 1],
  },
  {
    card: "visa",
    category: "Education",
    merchants: ["Alura", "Livraria Cultura", "Coursera"],
    amount: [80, 280],
    perMonth: [0, 1],
  },
  {
    card: "amex",
    category: "Subscriptions",
    merchants: ["AWS", "GitHub", "Figma", "Vercel"],
    amount: [12, 190],
    perMonth: [2, 4],
  },
  {
    card: "amex",
    category: "Travel",
    merchants: ["Hotels.com", "Uber US"],
    amount: [60, 700],
    perMonth: [0, 1],
  },
];

export type SeriesSpec = {
  name: string;
  kind: TransactionKind.INCOME | TransactionKind.EXPENSE | TransactionKind.CREDIT_CARD_PURCHASE;
  category: string;
  amountMajor: number;
  recurrenceType: RecurrenceType;
  interval: number;
  installments: number | null;
  /** Anchor: `startsAgo` months before this month, on `day`. */
  startsAgo: number;
  day: number;
  wallet?: WalletKey;
  card?: CardKey;
  /** Paused right after creation, which drops its scheduled rows and keeps the
   * history — the shape a cancelled subscription leaves behind. */
  paused?: boolean;
  notes?: string;
};

export const SERIES: readonly SeriesSpec[] = [
  {
    name: "Salário",
    kind: TransactionKind.INCOME,
    category: "Salary",
    amountMajor: SALARY_MAJOR,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 5,
    wallet: "checking",
    notes: "Crédito em conta todo dia 5",
  },
  {
    name: "Aluguel",
    kind: TransactionKind.EXPENSE,
    category: "Rent",
    amountMajor: 2_350,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 10,
    wallet: "checking",
  },
  {
    name: "Internet + celular",
    kind: TransactionKind.EXPENSE,
    category: "Internet & Phone",
    amountMajor: 189.9,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 18,
    wallet: "checking",
  },
  {
    name: "Academia Smart Fit",
    kind: TransactionKind.EXPENSE,
    category: "Health",
    amountMajor: 129,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 3,
    wallet: "checking",
  },
  {
    name: "Feira semanal",
    kind: TransactionKind.EXPENSE,
    category: "Groceries",
    amountMajor: 165,
    recurrenceType: RecurrenceType.WEEKLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 6,
    wallet: "cash",
  },
  {
    name: "Seguro do carro",
    kind: TransactionKind.EXPENSE,
    category: "Insurance",
    amountMajor: 2_780,
    recurrenceType: RecurrenceType.YEARLY,
    interval: 1,
    installments: null,
    startsAgo: 11,
    day: 22,
    wallet: "checking",
  },
  {
    name: "Netflix",
    kind: TransactionKind.CREDIT_CARD_PURCHASE,
    category: "Subscriptions",
    amountMajor: 59.9,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 8,
    card: "mastercard",
  },
  {
    name: "Spotify Família",
    kind: TransactionKind.CREDIT_CARD_PURCHASE,
    category: "Subscriptions",
    amountMajor: 34.9,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 12,
    card: "mastercard",
  },
  {
    name: "Notebook 10x",
    kind: TransactionKind.CREDIT_CARD_PURCHASE,
    category: "Shopping",
    amountMajor: 480,
    recurrenceType: RecurrenceType.FIXED,
    interval: 1,
    installments: 10,
    startsAgo: 4,
    day: 18,
    card: "visa",
    notes: "Parcelado em 10x sem juros",
  },
  {
    name: "Curso de inglês 6x",
    kind: TransactionKind.EXPENSE,
    category: "Education",
    amountMajor: 430,
    recurrenceType: RecurrenceType.FIXED,
    interval: 1,
    installments: 6,
    startsAgo: 2,
    day: 15,
    wallet: "checking",
  },
  {
    name: "Retainer - cliente US",
    kind: TransactionKind.INCOME,
    category: "Freelance",
    amountMajor: 1_200,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 8,
    day: 20,
    wallet: "usd",
  },
  {
    name: "TV a cabo",
    kind: TransactionKind.EXPENSE,
    category: "Entertainment",
    amountMajor: 139.9,
    recurrenceType: RecurrenceType.MONTHLY,
    interval: 1,
    installments: null,
    startsAgo: 12,
    day: 24,
    wallet: "checking",
    paused: true,
    notes: "Cancelado — série pausada",
  },
];

export const MONTHLY_TRANSFERS: readonly {
  name: string;
  from: WalletKey;
  to: WalletKey;
  amount: readonly [number, number];
  day: number;
}[] = [
  {
    name: "Reserva de emergência",
    from: "checking",
    to: "savings",
    amount: [800, 800],
    day: 6,
  },
  {
    name: "Aporte mensal",
    from: "checking",
    to: "investments",
    amount: [3_000, 4_500],
    day: 7,
  },
  // What keeps the cash wallet from going negative: the weekly market series is
  // the only thing spending from it.
  {
    name: "Dinheiro da semana",
    from: "checking",
    to: "cash",
    amount: [950, 950],
    day: 8,
  },
];

/** Dated ahead on purpose: the transaction list and the dashboard both need
 * something still waiting on them. */
export const SCHEDULED_ONE_OFFS: readonly {
  name: string;
  category: string;
  amountMajor: number;
  monthsAhead: number;
  day: number;
  wallet: WalletKey;
}[] = [
  {
    name: "IPVA - parcela única",
    category: "Taxes",
    amountMajor: 1_840,
    monthsAhead: 1,
    day: 12,
    wallet: "checking",
  },
  {
    name: "Dentista - canal",
    category: "Health",
    amountMajor: 1_200,
    monthsAhead: 1,
    day: 22,
    wallet: "checking",
  },
  {
    name: "Passagens - férias",
    category: "Travel",
    amountMajor: 2_450,
    monthsAhead: 2,
    day: 8,
    wallet: "checking",
  },
  {
    name: "Matrícula do curso",
    category: "Education",
    amountMajor: 780,
    monthsAhead: 2,
    day: 18,
    wallet: "checking",
  },
  {
    name: "IPTU - 3ª parcela",
    category: "Taxes",
    amountMajor: 420,
    monthsAhead: 3,
    day: 10,
    wallet: "checking",
  },
];

/** Past-dated and left waiting, so the dashboard's overdue list is not empty. */
export const OVERDUE_ONE_OFFS: readonly {
  name: string;
  category: string;
  amountMajor: number;
  monthsAgo: number;
  day: number;
  wallet: WalletKey;
}[] = [
  {
    name: "Consulta médica (não paga)",
    category: "Health",
    amountMajor: 380,
    monthsAgo: 1,
    day: 19,
    wallet: "checking",
  },
  {
    name: "Multa de trânsito",
    category: "Fees & Interest",
    amountMajor: 195.23,
    monthsAgo: 0,
    day: 2,
    wallet: "checking",
  },
];

/**
 * Monthly limits on the categories the account actually spends on, in the
 * currency those wallets and cards use. The figures are set a little above a
 * typical month so the meters read as a mix rather than all green or all red —
 * `Dining Out` is deliberately tight, since a demo with nothing over budget
 * shows none of what the screen is for.
 */
export const BUDGETS: readonly {
  category: string;
  limitMajor: number;
  /** Only `monthly` and `yearly` exist here; a budget period is a month. */
  everyMonths?: number;
}[] = [
  { category: "Groceries", limitMajor: 1_600 },
  { category: "Dining Out", limitMajor: 700 },
  { category: "Transportation", limitMajor: 320 },
  { category: "Shopping", limitMajor: 900 },
  { category: "Entertainment", limitMajor: 400 },
  { category: "Personal Care", limitMajor: 300 },
  // Quarterly, so the seeded account also has a budget that skips months.
  { category: "Travel", limitMajor: 2_500, everyMonths: 3 },
];
