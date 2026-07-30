export const PAGE_SIZE = 20;

export function toOffset(page: number, pageSize = PAGE_SIZE) {
  return Math.max(0, (page - 1) * pageSize);
}

export function pageCount(total: number, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * The 1-based range shown on the current page, for "Showing 1–20 of 57".
 * `to` is clamped to `total` so the last page does not overstate itself.
 */
export function pageRange({
  page,
  total,
  pageSize = PAGE_SIZE,
}: {
  page: number;
  total: number;
  pageSize?: number;
}) {
  if (total === 0) {
    return { from: 0, to: 0 };
  }

  const from = toOffset(page, pageSize) + 1;

  return { from, to: Math.min(total, from + pageSize - 1) };
}
