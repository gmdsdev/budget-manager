import type { MessageTable } from "./table";

/**
 * The iOS home-screen widget renders words this app resolved for it: a WidgetKit
 * extension cannot import this package, so the snapshot it reads carries already
 * translated labels rather than keys. Everything the widget says *after* the app
 * has run once is therefore keyed here like any other screen.
 *
 * The two strings iOS shows *before* that — the widget gallery's name and
 * description, and the "nothing synced yet" placeholder — are the deliberate
 * exception, and they live in `apps/native/targets/widget/Localizable.xcstrings`.
 * They are drawn by the system when no JavaScript has ever run on the device, so
 * no catalog value could reach them.
 */
export const widget = {
  "widget.updated": {
    en: "Updated {time}",
    "pt-BR": "Atualizado em {time}",
  },
} as const satisfies MessageTable;
