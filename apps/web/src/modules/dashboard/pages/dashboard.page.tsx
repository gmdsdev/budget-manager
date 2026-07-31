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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@budget-manager/ui/components/select";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CurrencySection } from "../components/currency-section";
import { PendingList } from "../components/pending-list";
import { StatementsDueList } from "../components/statements-due-list";
import { useDashboardQuery } from "../queries/use-dashboard-query";
import { currentMonth, formatMonthLabel, shiftMonth } from "../utils/month";

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const { data, isPending, isError, error, refetch, isRefetching, isFetching } =
    useDashboardQuery(month);

  const monthLabel = formatMonthLabel(month);
  const isCurrentMonth = month === currentMonth();

  // One currency is in view at a time, and it is the whole page's scope: the
  // stored code is only a preference, so a currency that stops existing (or a
  // first load that has none yet) falls back to the first one the API returned.
  const currencies = data?.currencies ?? [];
  const summary =
    currencies.find((entry) => entry.currencyCode === currencyCode) ??
    currencies[0];
  const activeCurrency = summary?.currencyCode;

  return (
    <div className="pb-8">
      <header className="flex flex-col gap-3 pt-6 pb-4 sm:pt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">Dashboard</h1>

        {/* One control row above everything it scopes: every figure, chart and
            list below reads the same month and the same currency. The month
            label takes the slack on a phone so the two arrows stay at the
            edges, where thumbs are. */}
        <div className="flex flex-row items-center gap-2">
          {/* A single-currency account has nothing to pick, so the select only
              appears once there is a second one. */}
          {currencies.length > 1 && activeCurrency && (
            <Select<string>
              items={currencies.map((entry) => ({
                label: entry.currencyCode,
                value: entry.currencyCode,
              }))}
              id="dashboard-currency"
              value={activeCurrency}
              onValueChange={setCurrencyCode}
            >
              <SelectTrigger aria-label="Currency" className="min-w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((entry) => (
                  <SelectItem
                    key={entry.currencyCode}
                    value={entry.currencyCode}
                  >
                    {entry.currencyCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-1 flex-row items-center gap-1 sm:flex-none">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous"
              onClick={() => setMonth(shiftMonth(month, -1))}
            >
              <CaretLeftIcon aria-hidden />
            </Button>
            <span className="flex-1 text-center text-sm tabular-nums sm:min-w-36 sm:flex-none">
              {monthLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next"
              disabled={isCurrentMonth}
              onClick={() => setMonth(shiftMonth(month, 1))}
            >
              <CaretRightIcon aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      {isPending ? (
        <div className="space-y-4" role="status" aria-label="Loading dashboard">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="h-72 w-full lg:col-span-7" />
            <Skeleton className="h-72 w-full lg:col-span-5" />
          </div>
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
        // Refetching holds the previous render at reduced opacity rather than
        // dropping back to skeletons, so switching months never jumps.
        <div
          className={`space-y-8 transition-opacity ${
            isFetching ? "opacity-60" : ""
          }`}
        >
          {summary && (
            <CurrencySection summary={summary} monthLabel={monthLabel} />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <StatementsDueList
              statements={data.statements.filter(
                (bill) => bill.currencyCode === activeCurrency,
              )}
              today={data.today}
            />
            <PendingList
              items={data.pending.filter(
                (item) => item.walletCurrencyCode === activeCurrency,
              )}
              today={data.today}
            />
          </div>
        </div>
      )}
    </div>
  );
}
