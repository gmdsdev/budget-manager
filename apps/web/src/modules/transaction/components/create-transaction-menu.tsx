import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@budget-manager/ui/components/dropdown-menu";
import {
  ArrowsLeftRightIcon,
  BankIcon,
  CaretDownIcon,
  CreditCardIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import { CreateCardPaymentDialog } from "./create-card-payment-dialog";
import { CreateCardPurchaseDialog } from "./create-card-purchase-dialog";
import { CreateTransactionDialog } from "./create-transaction-dialog";
import { CreateTransferDialog } from "./create-transfer-dialog";

type CreateDialog =
  | "transaction"
  | "cardPurchase"
  | "cardPayment"
  | "transfer"
  | null;

/** The three rarer shapes, in the order they are offered in both layouts. */
const SECONDARY = [
  {
    dialog: "cardPurchase",
    label: "cardPurchase.create.trigger",
    icon: CreditCardIcon,
  },
  {
    dialog: "cardPayment",
    label: "cardPayment.create.trigger",
    icon: BankIcon,
  },
  {
    dialog: "transfer",
    label: "transfer.create.trigger",
    icon: ArrowsLeftRightIcon,
  },
] as const;

/**
 * Recording something is one primary action with the rarer shapes beside it —
 * never four peers of equal weight, which made the everyday income or expense as
 * hard to find as a card payment.
 *
 * Two layouts, same wiring. `split` is the page header: one pill with a caret,
 * because a header has width to spare and not height. `stacked` is the dashboard
 * hero, where there is a column of space and the actions read as that panel's
 * own set — so they get their own buttons instead of hiding behind a caret.
 *
 * The dialogs are controlled from here and **stay mounted**, which is what keeps
 * their reset-on-open behaviour: the date defaults to today and the wallet to
 * the first one, both read from outside the form.
 */
export function CreateTransactionMenu({
  layout = "split",
}: {
  layout?: "split" | "stacked";
} = {}) {
  const t = useTranslate();
  const [dialog, setDialog] = useState<CreateDialog>(null);

  function close(next: boolean) {
    if (!next) setDialog(null);
  }

  const dialogs: ReactNode = (
    <>
      <CreateTransactionDialog
        open={dialog === "transaction"}
        onOpenChange={close}
      />
      <CreateCardPurchaseDialog
        open={dialog === "cardPurchase"}
        onOpenChange={close}
      />
      <CreateCardPaymentDialog
        open={dialog === "cardPayment"}
        onOpenChange={close}
      />
      <CreateTransferDialog open={dialog === "transfer"} onOpenChange={close} />
    </>
  );

  if (layout === "stacked") {
    return (
      <>
        <div className="flex w-full flex-col gap-2 sm:w-52">
          <Button
            variant="onBrand"
            onClick={() => setDialog("transaction")}
            className="w-full"
          >
            <PlusIcon aria-hidden />
            {t("transaction.create.trigger")}
          </Button>
          {SECONDARY.map((entry) => (
            <Button
              key={entry.dialog}
              variant="ghostOnBrand"
              onClick={() => setDialog(entry.dialog)}
              className="w-full"
            >
              <entry.icon aria-hidden />
              {t(entry.label)}
            </Button>
          ))}
        </div>
        {dialogs}
      </>
    );
  }

  return (
    <>
      {/* The two halves read as one pill: the base variant is `rounded-full`, so
          each drops the radius on the side they meet. */}
      <div className="flex flex-row items-center">
        <Button
          className="rounded-r-none"
          onClick={() => setDialog("transaction")}
        >
          <PlusIcon aria-hidden />
          {t("transaction.create.trigger")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("transaction.create.moreTypes")}
                className="ml-px rounded-l-none px-2.5"
              >
                <CaretDownIcon aria-hidden />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {SECONDARY.map((entry) => (
              <DropdownMenuItem
                key={entry.dialog}
                onClick={() => setDialog(entry.dialog)}
              >
                <entry.icon aria-hidden />
                {t(entry.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {dialogs}
    </>
  );
}
