import { WalletDto } from "@budget-manager/schemas";
import WalletList from "../components/wallet-list";
import { CreateWalletDialog } from "../components/create-wallet-dialog";
import { useWalletsQuery } from "../queries/use-account-query";

export default function ListWalletsPage() {
  const { data, isLoading } = useWalletsQuery();

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>No data found</div>;

  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Wallets List</h1>
        <CreateWalletDialog />
      </header>
      <WalletList wallets={data as unknown as WalletDto[]} />
    </div>
  );
}
