import { Button } from "@budget-manager/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { ArchiveWalletDialog } from "../archive-wallet-dialog";
import { EditWalletDialog } from "../edit-wallet-dialog";
import type { WalletRow } from "../../types";

type RowDialog = "edit" | "archive" | null;

export function WalletRowActions({ wallet }: { wallet: WalletRow }) {
  const [dialog, setDialog] = useState<RowDialog>(null);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontalIcon />
              <span className="sr-only">Actions for {wallet.name}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("archive")}
          >
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "edit" && (
        <EditWalletDialog
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={(next) => setDialog(next ? "edit" : null)}
        />
      )}

      {dialog === "archive" && (
        <ArchiveWalletDialog
          key={wallet.id}
          wallet={wallet}
          open
          onOpenChange={(next) => setDialog(next ? "archive" : null)}
        />
      )}
    </div>
  );
}
