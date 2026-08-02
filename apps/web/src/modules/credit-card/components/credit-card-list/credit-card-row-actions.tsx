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
import { ArchiveCreditCardDialog } from "../archive-credit-card-dialog";
import { CreditCardBillsDialog } from "../credit-card-bills-dialog";
import { EditCreditCardDialog } from "../edit-credit-card-dialog";
import type { CreditCardRow } from "@budget-manager/client";

type RowDialog = "edit" | "archive" | "bills" | null;

export function CreditCardRowActions({ card }: { card: CreditCardRow }) {
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
                {t("common.actionsFor", { name: card.name })}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("bills")}>
            {t("creditCard.bills.trigger")}
          </DropdownMenuItem>
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
        <EditCreditCardDialog
          key={card.id}
          card={card}
          open
          onOpenChange={(next) => setDialog(next ? "edit" : null)}
        />
      )}

      {dialog === "bills" && (
        <CreditCardBillsDialog
          key={card.id}
          card={card}
          open
          onOpenChange={(next) => setDialog(next ? "bills" : null)}
        />
      )}

      {dialog === "archive" && (
        <ArchiveCreditCardDialog
          key={card.id}
          card={card}
          open
          onOpenChange={(next) => setDialog(next ? "archive" : null)}
        />
      )}
    </div>
  );
}
