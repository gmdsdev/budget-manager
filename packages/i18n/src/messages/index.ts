import { auth } from "./auth";
import { budget } from "./budget";
import { category } from "./category";
import { common } from "./common";
import { creditCard } from "./credit-card";
import { dashboard } from "./dashboard";
import { dates } from "./dates";
import { enums } from "./enums";
import { errors } from "./errors";
import { nav } from "./nav";
import { pagination } from "./pagination";
import { recurring } from "./recurring";
import { settings } from "./settings";
import { subscription } from "./subscription";
import { transaction } from "./transaction";
import { transactionImport } from "./transaction-import";
import { validation } from "./validation";
import { wallet } from "./wallet";
import { widget } from "./widget";

/**
 * Flat, dotted keys rather than a nested tree: `keyof typeof messages` is then
 * the exact set of keys, which is what lets `translate` read a message's
 * placeholders off its own literal type.
 */
export const messages = {
  ...auth,
  ...budget,
  ...category,
  ...common,
  ...creditCard,
  ...dashboard,
  ...dates,
  ...enums,
  ...errors,
  ...nav,
  ...pagination,
  ...recurring,
  ...settings,
  ...subscription,
  ...transaction,
  ...transactionImport,
  ...validation,
  ...wallet,
  ...widget,
} as const;
