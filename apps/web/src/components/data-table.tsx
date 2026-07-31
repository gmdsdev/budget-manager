import { useIsCompact } from "@budget-manager/ui/hooks/use-media-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@budget-manager/ui/components/table";
import {
  type Cell,
  type Column,
  type ColumnDef,
  type Row,
  type RowData,
  type Table as TableInstance,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, type ReactNode } from "react";

declare module "@tanstack/react-table" {
  // Declaration merging only applies when the type parameters match the
  // original name for name, so neither can be renamed to satisfy no-unused-vars.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * The column's name in the card layout, where the header row is gone. Falls
     * back to a string `header`.
     */
    label?: string;
    /**
     * Where the column goes in a card. `primary` heads it, `trailing` sits
     * opposite the heading, `actions` is the row menu, `hidden` is dropped —
     * anything unset becomes a labelled line underneath.
     */
    mobile?: "primary" | "trailing" | "actions" | "hidden";
    /**
     * The column that takes the table's spare width, so every other one
     * shrinks to the width of its own content. At most one per table.
     */
    grow?: boolean;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId: (row: TData) => string;
  caption?: string;
  emptyState?: ReactNode;
  /**
   * Groups consecutive rows under a shared header instead of repeating the
   * value on every row. Grouping never reorders: rows are expected to arrive
   * already sorted by the grouping key.
   */
  groupBy?: (row: TData) => string;
  groupHeader?: (key: string) => ReactNode;
}

interface RowGroup<TData> {
  key: string | null;
  rows: Row<TData>[];
}

function groupRows<TData>(
  rows: Row<TData>[],
  groupBy?: (row: TData) => string,
): RowGroup<TData>[] {
  if (rows.length === 0) return [];
  if (!groupBy) return [{ key: null, rows }];

  const groups: RowGroup<TData>[] = [];

  for (const row of rows) {
    const key = groupBy(row.original);
    const last = groups.at(-1);

    if (last && last.key === key) {
      last.rows.push(row);
    } else {
      groups.push({ key, rows: [row] });
    }
  }

  return groups;
}

function labelOf<TData>(column: Column<TData, unknown>) {
  const { meta, header } = column.columnDef;

  if (meta?.label) return meta.label;

  return typeof header === "string" ? header : column.id;
}

function renderCell<TData>(cell: Cell<TData, unknown> | undefined) {
  if (!cell) return null;

  return flexRender(cell.column.columnDef.cell, cell.getContext());
}

function slotOf<TData>(column: Column<TData, unknown>) {
  return column.columnDef.meta?.mobile;
}

function growClassOf<TData>(column: Column<TData, unknown>) {
  return column.columnDef.meta?.grow ? "w-full whitespace-normal" : undefined;
}

/**
 * One card per row, built from the same column definitions: an eight-column
 * table wants about 1000px, which no phone has, and scrolling a table sideways
 * hides the very columns a reader is comparing.
 */
function CardList<TData>({
  table,
  groups,
  groupHeader,
  caption,
  emptyState,
}: {
  table: TableInstance<TData>;
  groups: RowGroup<TData>[];
  groupHeader: (key: string) => ReactNode;
  caption?: string;
  emptyState?: ReactNode;
}) {
  const columns = table.getVisibleFlatColumns();
  const primary = columns.find((column) => slotOf(column) === "primary");
  const trailing = columns.find((column) => slotOf(column) === "trailing");
  const actions = columns.find((column) => slotOf(column) === "actions");
  const details = columns.filter((column) => slotOf(column) === undefined);

  if (groups.length === 0) {
    return (
      <div className="rounded-none border-2 border-border bg-card p-4 text-center shadow-brutal">
        {emptyState ?? "No results."}
      </div>
    );
  }

  return (
    <ul
      aria-label={caption}
      className="divide-y divide-border/25 rounded-none border-2 border-border bg-card shadow-brutal"
    >
      {groups.map((group) => (
        <Fragment key={group.key ?? "all"}>
          {group.key !== null && (
            <li className="bg-muted/50 px-3 py-2 text-[11px] font-bold tracking-wider uppercase">
              {groupHeader(group.key)}
            </li>
          )}
          {group.rows.map((row) => {
              const cells = new Map(
                row.getVisibleCells().map((cell) => [cell.column.id, cell]),
              );

              return (
                <li key={row.id} className="space-y-2 p-3">
                  <div className="flex flex-row items-start justify-between gap-2">
                    {primary ? (
                      <div className="min-w-0 flex-1 text-sm font-medium">
                        {renderCell(cells.get(primary.id))}
                      </div>
                    ) : null}
                    {trailing ? (
                      <div className="shrink-0 text-sm">
                        {renderCell(cells.get(trailing.id))}
                      </div>
                    ) : null}
                    {actions ? (
                      <div className="-mt-1 -mr-1 shrink-0">
                        {renderCell(cells.get(actions.id))}
                      </div>
                    ) : null}
                  </div>

                  {details.length > 0 && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      {details.map((column) => (
                        <Fragment key={column.id}>
                          <dt className="text-muted-foreground">
                            {labelOf(column)}
                          </dt>
                          {/* A cell that renders a flex box of its own (a category
                              and its swatch) packs to the start and ignores
                              text-align, so element children are justified too. */}
                          <dd className="min-w-0 text-right break-words [&>*]:justify-end">
                            {renderCell(cells.get(column.id))}
                          </dd>
                        </Fragment>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
        </Fragment>
      ))}
    </ul>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  getRowId,
  caption,
  emptyState,
  groupBy,
  groupHeader = (key) => key,
}: DataTableProps<TData, TValue>) {
  const isCompact = useIsCompact();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  const groups = groupRows(table.getRowModel().rows, groupBy);
  const visibleColumnCount = table.getVisibleFlatColumns().length;

  if (isCompact) {
    return (
      <CardList
        table={table}
        groups={groups}
        groupHeader={groupHeader}
        caption={caption}
        emptyState={emptyState}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-none border-2 border-border bg-card shadow-brutal">
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  scope="col"
                  className={growClassOf(header.column)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groups.length > 0 ? (
            groups.map((group) => (
              <Fragment key={group.key ?? "all"}>
                {group.key !== null && (
                  /* The e2e row helpers count `tbody tr`, so a header row
                     must stay distinguishable from a data row. */
                  <TableRow
                    data-group-header
                    className="bg-muted/50 hover:bg-muted/50"
                  >
                    <TableHead
                      scope="colgroup"
                      colSpan={visibleColumnCount}
                      className="h-8"
                    >
                      {groupHeader(group.key)}
                    </TableHead>
                  </TableRow>
                )}
                {group.rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={growClassOf(cell.column)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={visibleColumnCount}
                className="h-24 text-center"
              >
                {emptyState ?? "No results."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
