import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import { DotsThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useSetBudgetActiveMutation } from "../../mutations/use-budget-mutation";
import type { BudgetRow } from "../../types";
import { BudgetPeriodsDialog } from "../budget-periods-dialog";
import { DeleteBudgetDialog } from "../delete-budget-dialog";
import { EditBudgetDialog } from "../edit-budget-dialog";

type RowDialog = "edit" | "periods" | "delete" | null;

export function BudgetRowActions({ budget }: { budget: BudgetRow }) {
  const t = useTranslate();
  const [dialog, setDialog] = useState<RowDialog>(null);
  const setActiveMutation = useSetBudgetActiveMutation();

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <DotsThreeIcon />
              <span className="sr-only">
                {t("common.actionsFor", { name: budget.categoryName })}
              </span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("periods")}>
            {t("budget.periods.action")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            {t("budget.edit.action")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={setActiveMutation.isPending}
            onClick={() =>
              setActiveMutation.mutate({
                id: budget.id,
                isActive: !budget.isActive,
              })
            }
          >
            {budget.isActive
              ? t("budget.pause.action")
              : t("budget.resume.action")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("delete")}
          >
            {t("budget.delete.submit")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "periods" && (
        <BudgetPeriodsDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={(next) => setDialog(next ? "periods" : null)}
        />
      )}

      {dialog === "edit" && (
        <EditBudgetDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={(next) => setDialog(next ? "edit" : null)}
        />
      )}

      {dialog === "delete" && (
        <DeleteBudgetDialog
          key={budget.id}
          budget={budget}
          open
          onOpenChange={(next) => setDialog(next ? "delete" : null)}
        />
      )}
    </div>
  );
}
