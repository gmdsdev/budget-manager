import { formatDate } from "../../dates";
import { computeCardBalances } from "../credit-card/balance";
import { computeBillTotals } from "../credit-card/bill-totals";
import { computeWalletBalances } from "../wallet/balance";
import type { DashboardRepository } from "./repository";
import { buildCurrencySummaries, monthRange, resolveMonth } from "./summary";

const PENDING_LIMIT = 6;
const STATEMENT_LIMIT = 6;

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getSummary({
    userId,
    month,
    now = new Date(),
  }: {
    userId: string;
    month?: string;
    now?: Date;
  }) {
    const resolvedMonth = month ?? resolveMonth(now);
    const { from, to } = monthRange(resolvedMonth);
    const today = formatDate(now);

    const [
      wallets,
      walletMovements,
      cards,
      cardMovements,
      bills,
      billMovements,
      monthMovements,
      categoryMovements,
      pending,
    ] = await Promise.all([
      this.repository.listActiveWallets({ userId }),
      this.repository.getMovementTotals({ userId }),
      this.repository.listActiveCards({ userId }),
      this.repository.getCardMovementTotals({ userId }),
      this.repository.listBills({ userId }),
      this.repository.getBillMovementTotals({ userId }),
      this.repository.getMonthMovements({ userId, from, to }),
      this.repository.getMonthCategoryMovements({ userId, from, to }),
      this.repository.getPending({ userId, limit: PENDING_LIMIT }),
    ]);

    // Reuses the same tested rules the wallet and card pages use, so the
    // dashboard can never disagree with them.
    const walletBalances = computeWalletBalances(wallets, walletMovements);
    const cardBalances = computeCardBalances(cards, cardMovements);

    // Only statements with something still owed, soonest due first — a settled
    // statement is not something to act on.
    const statements = computeBillTotals(bills, billMovements, today)
      .filter((bill) => bill.remainingCents > 0)
      .slice(0, STATEMENT_LIMIT);

    return {
      month: resolvedMonth,
      monthStart: from,
      monthEnd: to,
      // Sent so the client flags overdue rows against the server's clock.
      today,
      currencies: buildCurrencySummaries({
        wallets: walletBalances,
        cards: cardBalances,
        monthMovements,
        categoryMovements,
      }),
      pending,
      statements,
    };
  }
}
