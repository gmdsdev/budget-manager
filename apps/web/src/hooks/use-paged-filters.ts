import { useCallback, useState } from "react";

/**
 * Filters and page number in one piece of state, so changing a filter always
 * resets to page 1. Kept together deliberately: with two separate `useState`
 * calls, every caller has to remember the reset, and forgetting it strands the
 * user on a page that no longer exists ("page 3 of 1", showing nothing).
 */
export function usePagedFilters<TFilters>(initialFilters: TFilters) {
  const [state, setState] = useState({ filters: initialFilters, page: 1 });

  const setFilters = useCallback((filters: TFilters) => {
    setState({ filters, page: 1 });
  }, []);

  const setPage = useCallback((page: number) => {
    setState((current) => ({ ...current, page: Math.max(1, page) }));
  }, []);

  return { filters: state.filters, page: state.page, setFilters, setPage };
}
