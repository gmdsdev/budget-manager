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
import { ArchiveCategoryDialog } from "../archive-category-dialog";
import { EditCategoryDialog } from "../edit-category-dialog";
import type { CategoryRow } from "../../types";

type RowDialog = "edit" | "archive" | null;

export function CategoryRowActions({ category }: { category: CategoryRow }) {
  const [dialog, setDialog] = useState<RowDialog>(null);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8">
              <DotsThreeIcon />
              <span className="sr-only">Actions for {category.name}</span>
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
        <EditCategoryDialog
          key={category.id}
          category={category}
          open
          onOpenChange={(next) => setDialog(next ? "edit" : null)}
        />
      )}

      {dialog === "archive" && (
        <ArchiveCategoryDialog
          key={category.id}
          category={category}
          open
          onOpenChange={(next) => setDialog(next ? "archive" : null)}
        />
      )}
    </div>
  );
}
