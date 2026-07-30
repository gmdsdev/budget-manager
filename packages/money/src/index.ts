export const MONEY_MIN_MINOR_UNITS = -2_147_483_648;
export const MONEY_MAX_MINOR_UNITS = 2_147_483_647;

const DEFAULT_MINOR_UNIT_DIGITS = 2;

const MINOR_UNIT_DIGITS: Readonly<Record<string, number>> = {
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  CLF: 4,
  UYW: 4,
};

export function minorUnitDigits(currencyCode: string): number {
  const code = currencyCode?.toUpperCase() ?? "";

  return MINOR_UNIT_DIGITS[code] ?? DEFAULT_MINOR_UNIT_DIGITS;
}

const FALLBACK_LOCALE = "en-US";

const CURRENCY_LOCALE: Readonly<Record<string, string>> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  KRW: "ko-KR",
  CNY: "zh-CN",
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string, digits: number) {
  const key = `${locale}|${currency}|${digits}`;
  let formatter = formatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatterCache.set(key, formatter);
  }

  return formatter;
}

export function formatMinorUnits(
  minorUnits: number,
  currencyCode: string,
): string {
  const code = (currencyCode ?? "").toUpperCase();
  const digits = minorUnitDigits(code);
  const amount = (Number.isFinite(minorUnits) ? minorUnits : 0) / 10 ** digits;

  if (!/^[A-Z]{3}$/.test(code)) {
    return `${code} ${amount.toFixed(digits)}`.trim();
  }

  try {
    return getFormatter(
      CURRENCY_LOCALE[code] ?? FALLBACK_LOCALE,
      code,
      digits,
    ).format(amount);
  } catch {
    return `${code} ${amount.toFixed(digits)}`;
  }
}

const compactFormatterCache = new Map<string, Intl.NumberFormat>();

function getCompactFormatter(locale: string, currency: string) {
  const key = `${locale}|${currency}`;
  let formatter = compactFormatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
    compactFormatterCache.set(key, formatter);
  }

  return formatter;
}

/**
 * A short form for axis ticks, where the full figure would collide with its
 * neighbours. Values below one thousand keep their exact amount, so a tick is
 * never rounded into something the user cannot find in the list below it.
 */
export function formatCompactMinorUnits(
  minorUnits: number,
  currencyCode: string,
): string {
  const code = (currencyCode ?? "").toUpperCase();
  const digits = minorUnitDigits(code);
  const amount = (Number.isFinite(minorUnits) ? minorUnits : 0) / 10 ** digits;

  if (!/^[A-Z]{3}$/.test(code) || Math.abs(amount) < 1_000) {
    return formatMinorUnits(minorUnits, code);
  }

  try {
    return getCompactFormatter(
      CURRENCY_LOCALE[code] ?? FALLBACK_LOCALE,
      code,
    ).format(amount);
  } catch {
    return formatMinorUnits(minorUnits, code);
  }
}

export function parseMinorUnits(
  input: string,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): number {
  const negative = allowNegative && input.trimStart().startsWith("-");
  const digits = input.replace(/\D/g, "");
  const magnitude = digits === "" ? 0 : Number(digits);

  return negative ? -magnitude : magnitude;
}
