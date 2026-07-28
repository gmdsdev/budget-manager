import { WalletDto } from "@budget-manager/schemas";
import WalletList from "../components/wallet-list";
import { CreateWalletDialog } from "../components/create-wallet-dialog";

export default function ListWalletsPage({ wallets }: { wallets: WalletDto[] }) {
  return (
    <div>
      <header className="flex flex-row items-center justify-between py-4">
        <h1 className="text-2xl font-semibold">Wallets List</h1>
        <CreateWalletDialog />
      </header>
      <WalletList wallets={wallets} />
    </div>
  );
}
