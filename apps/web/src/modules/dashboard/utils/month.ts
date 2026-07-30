export function currentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-");
  const date = new Date(Number(year), Number(index) - 1 + delta, 1);

  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function formatMonthLabel(month: string) {
  const [year, index] = month.split("-");
  const date = new Date(Number(year), Number(index) - 1, 1);

  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatDayLabel(date: string) {
  const [year, month, day] = date.split("-");

  if (!year || !month || !day) return date;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
