import { render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, test } from "bun:test";
import { useState } from "react";

import { DataTable } from "./data-table";

type Row = { id: string; name: string };

function StatefulCell({ row }: { row: Row }) {
  const [captured] = useState(row.name);

  return <span data-testid={`captured-${row.id}`}>{captured}</span>;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <StatefulCell row={row.original} />,
  },
];

const ALICE = { id: "row-a", name: "Alice" };
const BOB = { id: "row-b", name: "Bob" };

describe("DataTable row identity", () => {
  test("per-row state follows the record across a reorder", () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={[ALICE, BOB]}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByTestId("captured-row-a").textContent).toBe("Alice");
    expect(screen.getByTestId("captured-row-b").textContent).toBe("Bob");

    rerender(
      <DataTable
        columns={columns}
        data={[BOB, ALICE]}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByTestId("captured-row-a").textContent).toBe("Alice");
    expect(screen.getByTestId("captured-row-b").textContent).toBe("Bob");
  });

  test("renders the empty state when there are no rows", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowId={(row) => row.id}
        emptyState={<span>No rows yet</span>}
      />,
    );

    expect(screen.getByText("No rows yet")).toBeDefined();
  });

  test("empty-state cell spans exactly the visible columns", () => {
    render(
      <DataTable columns={columns} data={[]} getRowId={(row) => row.id} />,
    );

    const cell = screen.getByText("No results.");

    expect(cell.getAttribute("colspan")).toBe("2");
  });
});

type DatedRow = { id: string; name: string; date: string };

const datedColumns: ColumnDef<DatedRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
];

describe("DataTable grouping", () => {
  test("consecutive rows with one key share a single header row", () => {
    const { container } = render(
      <DataTable
        columns={datedColumns}
        data={[
          { id: "a", name: "Alice", date: "2026-07-30" },
          { id: "b", name: "Bob", date: "2026-07-30" },
          { id: "c", name: "Carol", date: "2026-07-29" },
        ]}
        getRowId={(row) => row.id}
        groupBy={(row) => row.date}
        groupHeader={(key) => `on ${key}`}
      />,
    );

    const headers = container.querySelectorAll("tr[data-group-header]");

    expect(headers.length).toBe(2);
    expect(headers[0]?.textContent).toBe("on 2026-07-30");
    expect(headers[1]?.textContent).toBe("on 2026-07-29");
    expect(container.querySelectorAll("tbody tr").length).toBe(5);
  });

  test("header rows span the visible columns and are not data cells", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[{ id: "a", name: "Alice" }]}
        getRowId={(row) => row.id}
        groupBy={() => "2026-07-30"}
      />,
    );

    const header = container.querySelector("tr[data-group-header] th");

    expect(header?.getAttribute("colspan")).toBe("2");
    expect(container.querySelectorAll("tr[data-group-header] td").length).toBe(
      0,
    );
  });

  test("an empty grouped table still shows the empty state", () => {
    render(
      <DataTable
        columns={datedColumns}
        data={[]}
        getRowId={(row) => row.id}
        groupBy={(row) => row.date}
      />,
    );

    expect(screen.getByText("No results.")).toBeDefined();
  });
});
