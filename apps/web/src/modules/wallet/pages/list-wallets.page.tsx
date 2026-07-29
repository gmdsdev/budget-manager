import { getErrorMessage } from "@/utils/error-message";
import { Button } from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { CreateWalletDialog } from "../components/create-wallet-dialog";
import { walletColumns } from "../components/wallet-list/columns";
import { DataTable } from "../components/wallet-list/data-table";
import { useWalletsQuery } from "../queries/use-wallets-query";

export default function ListWalletsPage() {
  const { data, isPending, isError, error, refetch, isRefetching } =
    useWalletsQuery();

  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Wallets</h1>
        <CreateWalletDialog />
      </header>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading wallets">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Couldn't load your wallets</EmptyTitle>
            <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} disabled={isRefetching}>
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <DataTable
          columns={walletColumns}
          data={data}
          getRowId={(wallet) => wallet.id}
          caption="Your wallets"
          emptyState={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No wallets yet</EmptyTitle>
                <EmptyDescription>
                  Create your first wallet to start tracking your finances.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
        />
      )}
    </div>
  );
}
