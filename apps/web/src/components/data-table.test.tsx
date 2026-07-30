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
