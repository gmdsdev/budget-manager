export function todayAsDateString() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDateString(value: string | null) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
