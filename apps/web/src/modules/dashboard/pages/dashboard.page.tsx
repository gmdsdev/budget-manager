import { getErrorMessage } from "@/utils/error-message";
import {
  Button,
  buttonVariants,
} from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CurrencySummaryCard } from "../components/currency-summary-card";
import { PendingList } from "../components/pending-list";
import { StatementsDueList } from "../components/statements-due-list";
import { useDashboardQuery } from "../queries/use-dashboard-query";
import {
  currentMonth,
  formatMonthLabel,
  shiftMonth,
} from "../utils/month";

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data, isPending, isError, error, refetch, isRefetching } =
    useDashboardQuery(month);

  const monthLabel = formatMonthLabel(month);
  const isCurrentMonth = month === currentMonth();

  return (
    <div>
      <header className="flex flex-row flex-wrap items-center justify-between gap-4 py-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            Previous
          </Button>
          <span className="min-w-36 text-center text-sm tabular-nums">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            disabled={isCurrentMonth}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            Next
          </Button>
        </div>
      </header>

      {isPending ? (
        <div className="space-y-4" role="status" aria-label="Loading dashboard">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your dashboard</EmptyTitle>
            <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} disabled={isRefetching}>
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </EmptyContent>
        </Empty>
      ) : data.currencies.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing to summarize yet</EmptyTitle>
            <EmptyDescription>
              Create a wallet and record a transaction, and your balances and
              spending will show up here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {/* A navigation target stays an <a>: Base UI's Button would
                force role="button" onto it. Borrow the styling instead. */}
            <Link to="/wallet" className={buttonVariants()}>
              Go to wallets
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4 pb-8">
          {data.currencies.map((summary) => (
            <CurrencySummaryCard
              key={summary.currencyCode}
              summary={summary}
              monthLabel={monthLabel}
            />
          ))}

          <StatementsDueList statements={data.statements} today={data.today} />

          <PendingList items={data.pending} today={data.today} />
        </div>
      )}
    </div>
  );
}
