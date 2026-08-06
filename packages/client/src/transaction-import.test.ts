import {
  CategoryType,
  IMPORT_MAX_ROWS,
  TransactionKind,
  TransactionStatus,
} from "@budget-manager/schemas";
import { describe, expect, test } from "bun:test";
import {
  buildImportTemplateCsv,
  importRowsInput,
  isIsoDateString,
  matchImportRows,
  parseAmountToMinorUnits,
  parseCsv,
  readImportCsv,
  revalidateImportRow,
  type ImportMatchOptions,
  type ImportRowDraft,
} from "./transaction-import";

const OPTIONS: ImportMatchOptions = {
  wallets: [
    { id: "wallet-1", name: "Checking", currencyCode: "BRL" },
    { id: "wallet-2", name: "Cash", currencyCode: "BRL" },
    { id: "wallet-3", name: "Yen wallet", currencyCode: "JPY" },
  ],
  cards: [{ id: "card-1", name: "My credit card", currencyCode: "BRL" }],
  categories: [
    { id: "category-salary", name: "Salary", type: CategoryType.INCOME },
    { id: "category-groceries", name: "Groceries", type: CategoryType.EXPENSE },
    {
      id: "category-entertainment",
      name: "Entertainment",
      type: CategoryType.EXPENSE,
    },
    { id: "category-gifts-in", name: "Gifts", type: CategoryType.INCOME },
    { id: "category-gifts-out", name: "Gifts", type: CategoryType.EXPENSE },
    { id: "category-dup-a", name: "Twice", type: CategoryType.EXPENSE },
    { id: "category-dup-b", name: "Twice", type: CategoryType.EXPENSE },
  ],
};

const HEADER = "description,amount,type,date,category,account";

function draftsFrom(csv: string, options: ImportMatchOptions = OPTIONS) {
  const read = readImportCsv(csv);

  if (!("rows" in read)) {
    throw new Error(`expected rows, got ${read.error}`);
  }

  return matchImportRows(read.rows, options);
}

describe("parseCsv", () => {
  test("splits rows and cells", () => {
    expect(parseCsv("a,b,c\nd,e,f")).toEqual([
      ["a", "b", "c"],
      ["d", "e", "f"],
    ]);
  });

  test("reads quoted fields with commas, escaped quotes and newlines", () => {
    expect(parseCsv('"a,b","he said ""hi""","two\nlines"')).toEqual([
      ["a,b", 'he said "hi"', "two\nlines"],
    ]);
  });

  test("handles CRLF line endings and a trailing newline", () => {
    expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  test("keeps empty cells", () => {
    expect(parseCsv("a,,c")).toEqual([["a", "", "c"]]);
  });
});

describe("readImportCsv", () => {
  test("labels cells by header, whatever the column order or casing", () => {
    const read = readImportCsv(
      "Account,DATE,description,amount,type,category,extra\nChecking,2026-08-03,Groceries,150.75,expense,Groceries,ignored",
    );

    expect(read).toEqual({
      rows: [
        {
          description: "Groceries",
          amount: "150.75",
          type: "expense",
          date: "2026-08-03",
          category: "Groceries",
          account: "Checking",
        },
      ],
    });
  });

  test("names the missing columns", () => {
    expect(readImportCsv("description,amount\nCoffee,12")).toEqual({
      error: "missingColumns",
      columns: ["type", "date", "category", "account"],
    });
  });

  test("an empty file and a header-only file are both empty", () => {
    expect(readImportCsv("")).toEqual({ error: "emptyFile" });
    expect(readImportCsv(`${HEADER}\n`)).toEqual({ error: "emptyFile" });
  });

  test("caps the row count", () => {
    const rows = Array.from(
      { length: IMPORT_MAX_ROWS + 1 },
      () => "Coffee,12.00,expense,2026-08-03,,Checking",
    );

    expect(readImportCsv([HEADER, ...rows].join("\n"))).toEqual({
      error: "tooManyRows",
      max: IMPORT_MAX_ROWS,
    });
  });

  test("drops blank lines instead of reporting them as rows", () => {
    const read = readImportCsv(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,,Checking\n,,,,,\n\n`,
    );

    expect("rows" in read && read.rows.length).toBe(1);
  });
});

describe("parseAmountToMinorUnits", () => {
  test("reads dot and comma decimals", () => {
    expect(parseAmountToMinorUnits("1234.56", 2)).toBe(123_456);
    expect(parseAmountToMinorUnits("1234,56", 2)).toBe(123_456);
    expect(parseAmountToMinorUnits("12.5", 2)).toBe(1_250);
  });

  test("the last separator wins when both appear", () => {
    expect(parseAmountToMinorUnits("1.234,56", 2)).toBe(123_456);
    expect(parseAmountToMinorUnits("1,234.56", 2)).toBe(123_456);
  });

  test("a repeated single separator is grouping", () => {
    expect(parseAmountToMinorUnits("1.234.567", 2)).toBe(123_456_700);
  });

  test("shifts whole numbers by the currency's digits", () => {
    expect(parseAmountToMinorUnits("1500", 2)).toBe(150_000);
    expect(parseAmountToMinorUnits("1500", 0)).toBe(1_500);
  });

  test("rejects more fraction digits than the currency has", () => {
    expect(parseAmountToMinorUnits("12.345", 2)).toBeNull();
    expect(parseAmountToMinorUnits("12.5", 0)).toBeNull();
  });

  test("rejects zero, negatives and garbage", () => {
    expect(parseAmountToMinorUnits("0", 2)).toBeNull();
    expect(parseAmountToMinorUnits("0.00", 2)).toBeNull();
    expect(parseAmountToMinorUnits("-12.50", 2)).toBeNull();
    expect(parseAmountToMinorUnits("R$ 12,50", 2)).toBeNull();
    expect(parseAmountToMinorUnits("twelve", 2)).toBeNull();
    expect(parseAmountToMinorUnits("", 2)).toBeNull();
    expect(parseAmountToMinorUnits(".", 2)).toBeNull();
  });
});

describe("isIsoDateString", () => {
  test("accepts real calendar dates only", () => {
    expect(isIsoDateString("2026-08-03")).toBe(true);
    expect(isIsoDateString("2024-02-29")).toBe(true);
    expect(isIsoDateString("2026-02-29")).toBe(false);
    expect(isIsoDateString("2026-13-01")).toBe(false);
    expect(isIsoDateString("2026-04-31")).toBe(false);
    expect(isIsoDateString("03/08/2026")).toBe(false);
    expect(isIsoDateString("2026-8-3")).toBe(false);
  });
});

describe("matchImportRows", () => {
  test("a clean wallet row resolves with no issues", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nGroceries,150.75,expense,2026-08-03,Groceries,Checking`,
    );

    expect(draft).toMatchObject({
      name: "Groceries",
      amountCents: 15_075,
      kind: TransactionKind.EXPENSE,
      occurrenceDate: "2026-08-03",
      account: { kind: "wallet", id: "wallet-1" },
      categoryId: "category-groceries",
      issues: [],
    });
  });

  test("a card row needs no type and lands on the card", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nStreaming,29.90,,2026-08-05,Entertainment,My credit card`,
    );

    expect(draft).toMatchObject({
      account: { kind: "card", id: "card-1" },
      categoryId: "category-entertainment",
      issues: [],
    });
  });

  test("matching is trimmed and case-insensitive", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nGroceries,150.75,EXPENSE,2026-08-03,  groceries ,  CHECKING `,
    );

    expect(draft).toMatchObject({
      account: { kind: "wallet", id: "wallet-1" },
      categoryId: "category-groceries",
      issues: [],
    });
  });

  test("a name carried by both a wallet and a card is ambiguous", () => {
    const options: ImportMatchOptions = {
      ...OPTIONS,
      cards: [{ id: "card-x", name: "Checking", currencyCode: "BRL" }],
    };
    const [draft] = draftsFrom(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,,Checking`,
      options,
    );

    expect(draft?.account).toBeNull();
    expect(draft?.issues).toContain("ambiguousAccount");
  });

  test("an income and an expense category sharing a name resolve by kind", () => {
    const [income, expense] = draftsFrom(
      [
        HEADER,
        "Birthday,100.00,income,2026-08-03,Gifts,Checking",
        "Birthday,100.00,expense,2026-08-03,Gifts,Checking",
      ].join("\n"),
    );

    expect(income?.categoryId).toBe("category-gifts-in");
    expect(expense?.categoryId).toBe("category-gifts-out");
  });

  test("two categories with the same name and type are ambiguous", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,Twice,Checking`,
    );

    expect(draft?.categoryId).toBeNull();
    expect(draft?.issues).toContain("ambiguousCategory");
  });

  test("income on a card row is an issue, not a coercion", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nRefund,10.00,income,2026-08-03,,My credit card`,
    );

    expect(draft?.issues).toContain("cardRowIncome");
  });

  test("unreadable cells each raise their own issue", () => {
    const [draft] = draftsFrom(
      `${HEADER}\n,nope,later,someday,Nowhere,Ghost wallet`,
    );

    expect(draft?.issues).toContain("missingDescription");
    expect(draft?.issues).toContain("invalidType");
    expect(draft?.issues).toContain("invalidDate");
    expect(draft?.issues).toContain("unknownAccount");
  });

  test("the amount reads in the account's currency once matched", () => {
    const [yen] = draftsFrom(
      `${HEADER}\nCoffee,1500,expense,2026-08-03,,Yen wallet`,
    );

    expect(yen?.amountCents).toBe(1_500);
  });

  test("an unmatched account still reads the amount in the fallback currency", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,,Ghost wallet`,
      { ...OPTIONS, fallbackCurrencyCode: "BRL" },
    );

    expect(draft?.amountCents).toBe(1_200);
    expect(draft?.issues).not.toContain("invalidAmount");
  });

  test("without a fallback the amount waits for the account's currency", () => {
    const [draft] = draftsFrom(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,,Ghost wallet`,
    );

    expect(draft?.amountCents).toBeNull();
    expect(draft?.issues).not.toContain("invalidAmount");
  });
});

describe("revalidateImportRow", () => {
  function draft(csvLine: string): ImportRowDraft {
    const [first] = draftsFrom(`${HEADER}\n${csvLine}`);

    if (!first) {
      throw new Error("expected one draft");
    }

    return first;
  }

  test("fixing the account clears its issue and derives the amount", () => {
    const broken = draft("Coffee,12.00,expense,2026-08-03,,Ghost wallet");
    const fixed = revalidateImportRow(
      {
        ...broken,
        account: { kind: "wallet", id: "wallet-1" },
        accountEdited: true,
      },
      OPTIONS,
    );

    expect(fixed.issues).toEqual([]);
    expect(fixed.amountCents).toBe(1_200);
  });

  test("fixing the type re-resolves the category from the file's name", () => {
    const broken = draft("Birthday,100.00,gift,2026-08-03,Gifts,Checking");

    expect(broken.issues).toContain("invalidType");
    expect(broken.categoryId).toBeNull();

    const fixed = revalidateImportRow(
      { ...broken, kind: TransactionKind.INCOME },
      OPTIONS,
    );

    expect(fixed.issues).toEqual([]);
    expect(fixed.categoryId).toBe("category-gifts-in");
  });

  test("a hand-edited amount survives an account change", () => {
    const clean = draft("Coffee,12.00,expense,2026-08-03,,Checking");
    const edited = revalidateImportRow(
      { ...clean, amountCents: 999, amountEdited: true },
      OPTIONS,
    );
    const moved = revalidateImportRow(
      {
        ...edited,
        account: { kind: "wallet", id: "wallet-3" },
        accountEdited: true,
      },
      OPTIONS,
    );

    expect(moved.amountCents).toBe(999);
  });

  test("an untouched amount re-derives from the raw decimal on a currency change", () => {
    const clean = draft("Coffee,12.00,expense,2026-08-03,,Checking");

    expect(clean.amountCents).toBe(1_200);

    const moved = revalidateImportRow(
      {
        ...clean,
        account: { kind: "wallet", id: "wallet-3" },
        accountEdited: true,
      },
      OPTIONS,
    );

    expect(moved.amountCents).toBeNull();
    expect(moved.issues).toContain("invalidAmount");
  });

  test("the matched account's currency wins over the fallback", () => {
    const options = { ...OPTIONS, fallbackCurrencyCode: "BRL" };
    const [yen] = draftsFrom(
      `${HEADER}\nCoffee,1500,expense,2026-08-03,,Yen wallet`,
      options,
    );

    expect(yen?.amountCents).toBe(1_500);
  });

  test("a user-picked category is not overridden by the raw name", () => {
    const broken = draft("Coffee,12.00,expense,2026-08-03,Twice,Checking");
    const fixed = revalidateImportRow(
      { ...broken, categoryId: "category-dup-a", categoryEdited: true },
      OPTIONS,
    );

    expect(fixed.categoryId).toBe("category-dup-a");
    expect(fixed.issues).toEqual([]);
  });
});

describe("importRowsInput", () => {
  test("maps wallet and card drafts to the two payload shapes", () => {
    const drafts = draftsFrom(
      [
        HEADER,
        "Salary,5000.00,income,2026-08-01,Salary,Checking",
        "Streaming,29.90,expense,2026-08-05,Entertainment,My credit card",
      ].join("\n"),
    );

    expect(importRowsInput(drafts)).toEqual({
      rows: [
        {
          target: "wallet",
          kind: TransactionKind.INCOME,
          status: TransactionStatus.PAID,
          name: "Salary",
          amountCents: 500_000,
          occurrenceDate: "2026-08-01",
          walletId: "wallet-1",
          categoryId: "category-salary",
          notes: null,
        },
        {
          target: "card",
          status: TransactionStatus.PAID,
          name: "Streaming",
          amountCents: 2_990,
          occurrenceDate: "2026-08-05",
          creditCardId: "card-1",
          categoryId: "category-entertainment",
          notes: null,
        },
      ],
    });
  });

  test("refuses a draft that still carries issues", () => {
    const drafts = draftsFrom(
      `${HEADER}\nCoffee,12.00,expense,2026-08-03,,Ghost wallet`,
    );

    expect(() => importRowsInput(drafts)).toThrow();
  });
});

describe("buildImportTemplateCsv", () => {
  test("round-trips through the parser and matcher with no issues", () => {
    const drafts = draftsFrom(buildImportTemplateCsv(), {
      wallets: [{ id: "wallet-1", name: "Checking", currencyCode: "BRL" }],
      cards: [{ id: "card-1", name: "My credit card", currencyCode: "BRL" }],
      categories: [
        { id: "c-1", name: "Salary", type: CategoryType.INCOME },
        { id: "c-2", name: "Groceries", type: CategoryType.EXPENSE },
        { id: "c-3", name: "Entertainment", type: CategoryType.EXPENSE },
      ],
    });

    expect(drafts).toHaveLength(3);
    expect(drafts.every((row) => row.issues.length === 0)).toBe(true);
  });
});
