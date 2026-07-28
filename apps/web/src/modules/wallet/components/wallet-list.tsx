import { WalletDto } from "@budget-manager/schemas";
import { DataTable } from "./wallet-list/data-table";
import { columns } from "./wallet-list/columns";

export default function WalletList({ wallets }: { wallets: WalletDto[] }) {
  return <DataTable columns={columns} data={wallets} />;
}
