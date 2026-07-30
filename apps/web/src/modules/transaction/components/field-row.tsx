/**
 * Two fields side by side, stacking on narrow screens. The design pairs
 * Amount|Date and Wallet|Category so the modal reads in rows rather than one
 * long column.
 */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
  );
}
