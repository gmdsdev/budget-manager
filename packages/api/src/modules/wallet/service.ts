import type { WalletFormDto } from "@budget-manager/schemas";
import { ConflictError, NotFoundError } from "../../errors";
import { computeWalletBalances } from "./balance";
import type {
  WalletFilters,
  WalletRepository,
  WalletUpdatePatch,
} from "./repository";

export class WalletService {
  constructor(private readonly repository: WalletRepository) {}

  async getAll({
    userId,
    includeArchived,
    limit,
    offset,
    ...filters
  }: WalletFilters & {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    const [rows, movements, total] = await Promise.all([
      this.repository.getAll({
        userId,
        includeArchived,
        limit,
        offset,
        ...filters,
      }),
      this.repository.getMovementTotals({ userId }),
      this.repository.count({ userId, includeArchived, ...filters }),
    ]);

    return {
      rows: computeWalletBalances(rows, movements),
      total,
      limit,
      offset,
    };
  }

  async getOptions({ userId }: { userId: string }) {
    return await this.repository.listOptions({ userId });
  }

  async create({ userId, wallet }: { userId: string; wallet: WalletFormDto }) {
    const created = await this.repository.create({ userId, wallet });

    if (!created) {
      throw new Error("Wallet insert returned no row");
    }

    return created;
  }

  async update({
    id,
    userId,
    patch,
  }: {
    id: string;
    userId: string;
    patch: WalletUpdatePatch;
  }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.wallet");
    }

    await this.assertCurrencyStillFree({ id, existing, patch });

    const wallet = await this.repository.update({ id, userId, patch });

    if (!wallet) {
      throw new NotFoundError("error.notFound.wallet");
    }

    return wallet;
  }

  /**
   * A wallet's currency is the currency of everything already recorded against
   * it, and of the invariants around it — both legs of a transfer share one,
   * and a card payment has to match the card. Changing it under existing rows
   * would silently reprice history and break pairs the create paths refuse to
   * form, so it is fixed from the first row that references the wallet.
   */
  private async assertCurrencyStillFree({
    id,
    existing,
    patch,
  }: {
    id: string;
    existing: { currencyCode: string };
    patch: WalletUpdatePatch;
  }) {
    if (
      patch.currencyCode === undefined ||
      patch.currencyCode === existing.currencyCode
    ) {
      return;
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.walletCurrencyInUse", {
        references,
      });
    }
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const wallet = await this.repository.archive({ id, userId });

    if (!wallet) {
      throw new NotFoundError("error.notFound.wallet");
    }

    return wallet;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const wallet = await this.repository.unarchive({ id, userId });

    if (!wallet) {
      throw new NotFoundError("error.notFound.wallet");
    }

    return wallet;
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const existing = await this.repository.findById({ id, userId });

    if (!existing) {
      throw new NotFoundError("error.notFound.wallet");
    }

    const references = await this.repository.countReferences({ id });

    if (references > 0) {
      throw new ConflictError("error.conflict.walletInUse", { references });
    }

    await this.repository.delete({ id, userId });

    return { id };
  }
}
