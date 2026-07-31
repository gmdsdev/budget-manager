import { describe, expect, test } from "bun:test";

import { getActiveLocale, setActiveLocale, t } from "./active";
import { formatDateString, formatMonthString, parseDateString } from "./format";
import { DEFAULT_LOCALE, Locale, LOCALES, toLocale } from "./locale";
import { messages } from "./messages";
import { ref, translate } from "./translate";

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholdersOf(template: string) {
  return new Set(
    [...template.matchAll(PLACEHOLDER)].map((match) => match[1] as string),
  );
}

describe("toLocale", () => {
  test("keeps a supported tag", () => {
    expect(toLocale("pt-BR")).toBe(Locale.PT_BR);
  });

  test("matches on the language subtag", () => {
    expect(toLocale("pt")).toBe(Locale.PT_BR);
    expect(toLocale("pt-PT")).toBe(Locale.PT_BR);
    expect(toLocale("en-GB")).toBe(Locale.EN);
  });

  test("falls back for an unsupported or missing value", () => {
    expect(toLocale("de")).toBe(DEFAULT_LOCALE);
    expect(toLocale(null)).toBe(DEFAULT_LOCALE);
    expect(toLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(toLocale("")).toBe(DEFAULT_LOCALE);
  });
});

describe("catalog", () => {
  test("every key is translated into every locale", () => {
    for (const [key, entry] of Object.entries(messages)) {
      for (const locale of LOCALES) {
        expect(`${key}:${entry[locale]?.trim() ? "ok" : "missing"}`).toBe(
          `${key}:ok`,
        );
      }
    }
  });

  // A translation that drops or renames a placeholder renders `{name}` to the
  // user, which the types cannot catch: they only read the English literal.
  test("every translation declares the same placeholders as English", () => {
    for (const [key, entry] of Object.entries(messages)) {
      const expected = [...placeholdersOf(entry.en)].sort().join(",");

      for (const locale of LOCALES) {
        const actual = [...placeholdersOf(entry[locale])].sort().join(",");

        expect(`${key}/${locale}:${actual}`).toBe(`${key}/${locale}:${expected}`);
      }
    }
  });
});

describe("translate", () => {
  test("returns the locale's message", () => {
    expect(translate(Locale.EN, "common.cancel")).toBe("Cancel");
    expect(translate(Locale.PT_BR, "common.cancel")).toBe("Cancelar");
  });

  test("interpolates named placeholders", () => {
    expect(
      translate(Locale.EN, "pagination.wallets.summary", {
        from: 1,
        to: 5,
        total: 25,
      }),
    ).toBe("Showing 1–5 of 25 wallets");
  });

  test("resolves a placeholder that is itself a message", () => {
    expect(
      translate(Locale.PT_BR, "error.conflict.categoryOnCardPurchase", {
        categoryType: ref("enum.categoryType.income.inline"),
      }),
    ).toBe(
      "Uma categoria de receita não pode ser usada em uma compra no cartão.",
    );
  });

  test("leaves an unfilled placeholder alone rather than printing undefined", () => {
    expect(
      translate(Locale.EN, "pagination.wallets.summary", {
        from: 1,
        to: 5,
      } as never),
    ).toBe("Showing 1–5 of {total} wallets");
  });
});

describe("active locale", () => {
  test("t follows setActiveLocale", () => {
    const previous = getActiveLocale();

    try {
      setActiveLocale(Locale.PT_BR);
      expect(t("validation.nameRequired")).toBe("O nome é obrigatório");

      setActiveLocale(Locale.EN);
      expect(t("validation.nameRequired")).toBe("Name is required");
    } finally {
      setActiveLocale(previous);
    }
  });
});

describe("dates", () => {
  test("parses a date-only string as local midnight, not UTC", () => {
    const date = parseDateString("2026-03-01");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(1);
  });

  test("echoes a value that is not a date", () => {
    expect(parseDateString("nope")).toBeNull();
    expect(formatDateString(Locale.EN, "nope", "day")).toBe("nope");
    expect(formatMonthString(Locale.EN, "nope", "monthYear")).toBe("nope");
  });

  test("formats in the given locale", () => {
    expect(formatDateString(Locale.EN, "2026-07-31", "numeric")).toBe(
      "07/31/2026",
    );
    expect(formatDateString(Locale.PT_BR, "2026-07-31", "numeric")).toBe(
      "31/07/2026",
    );
  });

  test("formats a month key", () => {
    expect(formatMonthString(Locale.EN, "2026-07", "monthYear")).toBe(
      "July 2026",
    );
    expect(formatMonthString(Locale.PT_BR, "2026-07", "monthYear")).toBe(
      "julho de 2026",
    );
  });
});
