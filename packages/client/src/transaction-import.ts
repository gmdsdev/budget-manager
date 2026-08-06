import { MONEY_MAX_MINOR_UNITS, minorUnitDigits } from "@budget-manager/money";
import {
  CategoryType,
  IMPORT_MAX_ROWS,
  TRANSACTION_FORM_KINDS,
  TransactionKind,
  TransactionStatus,
  type ImportTransactionRowDto,
  type ImportTransactionsDto,
  type TransactionFormKind,
} from "@budget-manager/schemas";
import { todayAsDateString } from "./date-range";

/**
 * The CSV's own vocabulary. Headers and type values are stable English
 * whatever language the screen is in — a file made from the template has to
 * round-trip regardless of the app locale — matched trimmed and
 * case-insensitively, in any column order.
 */
export const IMPORT_CSV_COLUMNS = [
  "description",
  "amount",
  "type",
  "date",
  "category",
  "account",
] as const;

type ImportCsvColumn = (typeof IMPORT_CSV_COLUMNS)[number];

export type ImportCsvRow = Record<ImportCsvColumn, string>;

export type ImportCsvError =
  | { error: "emptyFile" }
  | { error: "missingColumns"; columns: string[] }
  | { error: "tooManyRows"; max: number };

/** RFC-4180: quoted fields, doubled-quote escapes, CRLF, newlines in quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let index = 0;

  const endCell = () => {
    row.push(cell);
    cell = "";
  };

  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 2;
          continue;
        }

        quoted = false;
        index += 1;
        continue;
      }

      cell += char;
      index += 1;
      continue;
    }

    if (char === '"' && cell === "") {
      quoted = true;
      index += 1;
      continue;
    }

    if (char === ",") {
      endCell();
      index += 1;
      continue;
    }

    if (char === "\n" || char === "\r") {
      endRow();
      index += char === "\r" && text[index + 1] === "\n" ? 2 : 1;
      continue;
    }

    cell += char;
    index += 1;
  }

  if (cell !== "" || row.length > 0) {
    endRow();
  }

  return rows;
}

/**
 * The file as labelled rows. The header decides which column is which, so
 * extra columns are ignored and order does not matter; rows with no content
 * at all (a trailing blank line) are dropped rather than reported as errors.
 */
export function readImportCsv(
  text: string,
): { rows: ImportCsvRow[] } | ImportCsvError {
  const parsed = parseCsv(text).filter((cells) =>
    cells.some((cell) => cell.trim() !== ""),
  );
  const header = parsed[0];

  if (!header) {
    return { error: "emptyFile" };
  }

  const indexByColumn = new Map<ImportCsvColumn, number>();

  header.forEach((cell, index) => {
    const name = cell.trim().toLowerCase();

    if (
      (IMPORT_CSV_COLUMNS as readonly string[]).includes(name) &&
      !indexByColumn.has(name as ImportCsvColumn)
    ) {
      indexByColumn.set(name as ImportCsvColumn, index);
    }
  });

  const missing = IMPORT_CSV_COLUMNS.filter(
    (column) => !indexByColumn.has(column),
  );

  if (missing.length > 0) {
    return { error: "missingColumns", columns: [...missing] };
  }

  const dataRows = parsed.slice(1);

  if (dataRows.length === 0) {
    return { error: "emptyFile" };
  }

  if (dataRows.length > IMPORT_MAX_ROWS) {
    return { error: "tooManyRows", max: IMPORT_MAX_ROWS };
  }

  return {
    rows: dataRows.map((cells) => {
      const row = {} as ImportCsvRow;

      for (const [column, index] of indexByColumn) {
        row[column] = cells[index] ?? "";
      }

      return row;
    }),
  };
}

/**
 * A major-unit decimal into minor units. Not `parseMinorUnits`, which strips
 * every non-digit for the digit-shifting input and would read "12.5" as 1.25.
 *
 * Separators: with both `.` and `,` present the last one is the decimal
 * separator and the other is grouping, so `1.234,56` and `1,234.56` both
 * work; a single separator appearing once is the decimal separator, and
 * appearing more than once is grouping. Zero, negatives and more fraction
 * digits than the currency has are rejected — the type column carries
 * direction, so an amount is always a positive figure.
 */
export function parseAmountToMinorUnits(
  input: string,
  digits: number,
): number | null {
  const raw = input.trim().replace(/\s/g, "");

  if (!/^[0-9.,]+$/.test(raw)) {
    return null;
  }

  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");

  let decimalSeparator: "." | "," | null = null;

  if (lastDot !== -1 && lastComma !== -1) {
    decimalSeparator = lastDot > lastComma ? "." : ",";
  } else if (lastDot !== -1) {
    decimalSeparator = raw.indexOf(".") === lastDot ? "." : null;
  } else if (lastComma !== -1) {
    decimalSeparator = raw.indexOf(",") === lastComma ? "," : null;
  }

  const separatorIndex =
    decimalSeparator === "." ? lastDot : decimalSeparator === "," ? lastComma : -1;
  const integerRaw = separatorIndex === -1 ? raw : raw.slice(0, separatorIndex);
  const fraction = separatorIndex === -1 ? "" : raw.slice(separatorIndex + 1);
  const integer = integerRaw.replace(/[.,]/g, "");

  if (!/^[0-9]*$/.test(fraction) || fraction.length > digits) {
    return null;
  }

  if (integer === "" && fraction === "") {
    return null;
  }

  const minorUnits =
    Number(integer || "0") * 10 ** digits +
    Number(fraction.padEnd(digits, "0") || "0");

  if (
    !Number.isSafeInteger(minorUnits) ||
    minorUnits < 1 ||
    minorUnits > MONEY_MAX_MINOR_UNITS
  ) {
    return null;
  }

  return minorUnits;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isIsoDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapDay =
    month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      ? 1
      : 0;
  const daysInMonth = (DAYS_IN_MONTH[month - 1] ?? 0) + leapDay;

  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth;
}

export type ImportAccountKind = "wallet" | "card";

export type ImportAccountRef = { kind: ImportAccountKind; id: string };

export type ImportRowIssue =
  | "missingDescription"
  | "invalidAmount"
  | "invalidType"
  | "invalidDate"
  | "missingAccount"
  | "unknownAccount"
  | "ambiguousAccount"
  | "unknownCategory"
  | "ambiguousCategory"
  | "cardRowIncome";

export type ImportAccountOption = {
  id: string;
  name: string;
  currencyCode: string;
};

export type ImportCategoryOption = {
  id: string;
  name: string;
  type: CategoryType;
};

/**
 * What the review screen already holds: the three `options` query payloads,
 * plus the currency to read amounts in until a row's account resolves — the
 * user's preference, the same default the create dialogs make. Without it a
 * row with an unmatched account would sit on an empty amount, which reads as
 * the figure having been lost rather than merely waiting.
 */
export type ImportMatchOptions = {
  wallets: ImportAccountOption[];
  cards: ImportAccountOption[];
  categories: ImportCategoryOption[];
  fallbackCurrencyCode?: string;
};

/**
 * One CSV line on the review screen. The `raw*` fields keep what the file
 * said so an unresolved cell can name itself in an issue message, and the
 * `*Edited` flags mark the fields where a user's pick must survive
 * revalidation — everything else is re-derived from the raw value on every
 * edit, which is what lets fixing the type auto-resolve the category.
 */
export type ImportRowDraft = {
  key: number;
  name: string;
  rawAmount: string;
  amountCents: number | null;
  amountEdited: boolean;
  kind: TransactionFormKind | null;
  rawType: string;
  occurrenceDate: string | null;
  rawDate: string;
  account: ImportAccountRef | null;
  accountEdited: boolean;
  rawAccount: string;
  categoryId: string | null;
  categoryEdited: boolean;
  rawCategory: string;
  issues: ImportRowIssue[];
};

const KIND_TO_CATEGORY_TYPE: Record<TransactionFormKind, CategoryType> = {
  [TransactionKind.INCOME]: CategoryType.INCOME,
  [TransactionKind.EXPENSE]: CategoryType.EXPENSE,
};

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

function parseKind(rawType: string): TransactionFormKind | null {
  const value = normalizedName(rawType);

  return (TRANSACTION_FORM_KINDS as readonly string[]).includes(value)
    ? (value as TransactionFormKind)
    : null;
}

function matchAccount(
  rawAccount: string,
  options: ImportMatchOptions,
): { account: ImportAccountRef | null; issue: ImportRowIssue | null } {
  const name = normalizedName(rawAccount);

  if (name === "") {
    return { account: null, issue: "missingAccount" };
  }

  const matches: ImportAccountRef[] = [
    ...options.wallets
      .filter((wallet) => normalizedName(wallet.name) === name)
      .map((wallet): ImportAccountRef => ({ kind: "wallet", id: wallet.id })),
    ...options.cards
      .filter((card) => normalizedName(card.name) === name)
      .map((card): ImportAccountRef => ({ kind: "card", id: card.id })),
  ];

  if (matches.length === 0) {
    return { account: null, issue: "unknownAccount" };
  }

  if (matches.length > 1) {
    return { account: null, issue: "ambiguousAccount" };
  }

  return { account: matches[0] ?? null, issue: null };
}

export function importAccountCurrency(
  account: ImportAccountRef | null,
  options: ImportMatchOptions,
): string | null {
  if (!account) {
    return null;
  }

  const list = account.kind === "wallet" ? options.wallets : options.cards;

  return list.find((item) => item.id === account.id)?.currencyCode ?? null;
}

/** The currency a row's amount reads in: its account's, or the fallback. */
export function importRowCurrency(
  account: ImportAccountRef | null,
  options: ImportMatchOptions,
): string | null {
  return (
    importAccountCurrency(account, options) ??
    options.fallbackCurrencyCode ??
    null
  );
}

/**
 * The one validator. Every load and every edit funnels a draft through here,
 * so an issue can never linger after the field it names was fixed — the
 * review screen's own version of "one validation cause, revalidated on
 * change".
 */
export function revalidateImportRow(
  draft: ImportRowDraft,
  options: ImportMatchOptions,
): ImportRowDraft {
  const issues: ImportRowIssue[] = [];
  const next = { ...draft };

  if (next.name.trim() === "") {
    issues.push("missingDescription");
  }

  if (!next.accountEdited) {
    const { account, issue } = matchAccount(next.rawAccount, options);

    next.account = account;

    if (issue) {
      issues.push(issue);
    }
  } else if (!next.account) {
    issues.push("missingAccount");
  }

  const isCardRow = next.account?.kind === "card";

  if (isCardRow && next.kind === TransactionKind.INCOME) {
    issues.push("cardRowIncome");
  }

  if (!isCardRow && next.kind === null) {
    issues.push("invalidType");
  }

  if (next.occurrenceDate === null) {
    issues.push("invalidDate");
  }

  const expectedCategoryType = isCardRow
    ? CategoryType.EXPENSE
    : next.kind
      ? KIND_TO_CATEGORY_TYPE[next.kind]
      : null;

  if (!next.categoryEdited) {
    const name = normalizedName(next.rawCategory);

    if (name === "") {
      next.categoryId = null;
    } else if (expectedCategoryType === null) {
      // The type issue blocks first; once it is fixed the category resolves.
      next.categoryId = null;
    } else {
      const matches = options.categories.filter(
        (category) =>
          category.type === expectedCategoryType &&
          normalizedName(category.name) === name,
      );

      if (matches.length === 0) {
        next.categoryId = null;
        issues.push("unknownCategory");
      } else if (matches.length > 1) {
        next.categoryId = null;
        issues.push("ambiguousCategory");
      } else {
        next.categoryId = matches[0]?.id ?? null;
      }
    }
  }

  const currencyCode = importRowCurrency(next.account, options);

  if (!next.amountEdited && currencyCode !== null) {
    next.amountCents = parseAmountToMinorUnits(
      next.rawAmount,
      minorUnitDigits(currencyCode),
    );
  }

  if (next.amountEdited || currencyCode !== null) {
    if (next.amountCents === null || next.amountCents < 1) {
      issues.push("invalidAmount");
    }
  }

  next.issues = issues;

  return next;
}

/** Every parsed line as a draft, matched against what the account holds. */
export function matchImportRows(
  rows: ImportCsvRow[],
  options: ImportMatchOptions,
): ImportRowDraft[] {
  return rows.map((row, index) =>
    revalidateImportRow(
      {
        key: index,
        name: row.description.trim(),
        rawAmount: row.amount.trim(),
        amountCents: null,
        amountEdited: false,
        kind: parseKind(row.type),
        rawType: row.type.trim(),
        occurrenceDate: isIsoDateString(row.date.trim())
          ? row.date.trim()
          : null,
        rawDate: row.date.trim(),
        account: null,
        accountEdited: false,
        rawAccount: row.account.trim(),
        categoryId: null,
        categoryEdited: false,
        rawCategory: row.category.trim(),
        issues: [],
      },
      options,
    ),
  );
}

/**
 * The tRPC payload for a fully-valid review. Imported rows are recorded as
 * already paid — an import is history by definition, same default the create
 * dialogs make.
 */
export function importRowsInput(
  drafts: ImportRowDraft[],
): ImportTransactionsDto {
  return {
    rows: drafts.map((draft): ImportTransactionRowDto => {
      if (
        draft.issues.length > 0 ||
        !draft.account ||
        draft.amountCents === null ||
        draft.occurrenceDate === null
      ) {
        throw new Error("Import row is not ready to submit");
      }

      const base = {
        status: TransactionStatus.PAID,
        name: draft.name.trim(),
        amountCents: draft.amountCents,
        occurrenceDate: draft.occurrenceDate,
        categoryId: draft.categoryId,
        notes: null,
      };

      if (draft.account.kind === "card") {
        return { ...base, target: "card", creditCardId: draft.account.id };
      }

      if (draft.kind === null) {
        throw new Error("Import row is not ready to submit");
      }

      return {
        ...base,
        target: "wallet",
        kind: draft.kind,
        walletId: draft.account.id,
      };
    }),
  };
}

/**
 * The example file. Its words are file content, not screen copy — the sample
 * category and account names match the defaults a fresh account starts with,
 * so the template imports cleanly before any renaming.
 */
export function buildImportTemplateCsv(): string {
  const today = todayAsDateString();

  return [
    IMPORT_CSV_COLUMNS.join(","),
    `Salary,5000.00,income,${today},Salary,Checking`,
    `Groceries,150.75,expense,${today},Groceries,Checking`,
    `Streaming subscription,29.90,expense,${today},Entertainment,My credit card`,
    "",
  ].join("\n");
}
