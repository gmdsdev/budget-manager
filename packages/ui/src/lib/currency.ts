const mapCurrencyCodeToLocale: Record<string, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  KRW: "ko-KR",
  CNY: "zh-CN",
};

export function formatFromCents(cents: number, currencyCode: string = "USD") {
  return (cents / 100).toLocaleString(mapCurrencyCodeToLocale[currencyCode], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
    currency: currencyCode,
  });
}

export function parseToCents(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits === "" ? 0 : Number(digits);
}
