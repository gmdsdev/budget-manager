import { Button } from "@budget-manager/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { useTranslate } from "@budget-manager/i18n/react";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ArchiveWalletDialog } from "../archive-wallet-dialog";
import { EditWalletDialog } from "../edit-wallet-dialog";
import type { WalletRow } from "@budget-manager/client";

type RowDialog = "edit" | "archive" | null;

export function WalletRowActions({ wallet }: { wallet: WalletRow }) {
  const t = useTranslate();
  const [dialog, setDialog] = useState<RowDialog>(null);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <DotsThreeIcon />
              <span className="sr-only">
                {t("common.actionsFor", { name: wallet.name })}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("archive")}
          >
            {t("common.archive")}
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
