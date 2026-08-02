import { useEffect, useRef } from "react";

/**
 * **A create form whose defaults are read from outside the form resets on open as well
 * as close**, because anything read from outside can move while the sheet is shut: every
 * create sheet defaults its date to today, so one opened after midnight would otherwise
 * offer yesterday, and the preferred currency, the first wallet and the month in view can
 * all have changed too.
 *
 * The web app gets this from its `Dialog`, whose `onOpenChange` fires in both directions.
 * Here the screen owns the open flag and the trigger is a button beside the list, so the
 * sheet has to watch the transition itself.
 */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const wasOpen = useRef(open);
  const resetRef = useRef(reset);

  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  useEffect(() => {
    if (open && !wasOpen.current) {
      resetRef.current();
    }

    wasOpen.current = open;
  }, [open]);
}
