import type { Db } from "@budget-manager/db";
import { creditCards } from "@budget-manager/db/schema/creditCard";
import { creditCardBills } from "@budget-manager/db/schema/creditCardBill";
import { transactionOccurrences } from "@budget-manager/db/schema/transactionOccurrence";
import { transactionTemplates } from "@budget-manager/db/schema/transactionTemplate";
import { wallets } from "@budget-manager/db/schema/wallet";
import type { WalletFormDto } from "@budget-manager/schemas";
import { and, asc, eq } from "drizzle-orm";

const WALLET_PUBLIC_COLUMNS = {
  id: wallets.id,
  name: wallets.name,
  type: wallets.type,
  openingBalanceCents: wallets.openingBalanceCents,
  currencyCode: wallets.currencyCode,
  isArchived: wallets.isArchived,
  createdAt: wallets.createdAt,
  updatedAt: wallets.updatedAt,
} as const;

export type WalletUpdatePatch = Partial<
  Pick<
    typeof wallets.$inferInsert,
    "name" | "type" | "currencyCode" | "openingBalanceCents"
  >
>;

function pickWalletUpdate(patch: WalletUpdatePatch): WalletUpdatePatch {
  const set: WalletUpdatePatch = {};

  if (patch.name !== undefined) {
    set.name = patch.name;
  }

  if (patch.type !== undefined) {
    set.type = patch.type;
  }

  if (patch.currencyCode !== undefined) {
    set.currencyCode = patch.currencyCode;
  }

  if (patch.openingBalanceCents !== undefined) {
    set.openingBalanceCents = patch.openingBalanceCents;
  }

  return set;
}

export class WalletRepository {
  constructor(private readonly db: Db) {}

  async getAll({
    userId,
    includeArchived,
    limit,
    offset,
  }: {
    userId: string;
    includeArchived: boolean;
    limit: number;
    offset: number;
  }) {
    return this.db
      .select(WALLET_PUBLIC_COLUMNS)
      .from(wallets)
      .where(
        includeArchived
          ? eq(wallets.userId, userId)
          : and(eq(wallets.userId, userId), eq(wallets.isArchived, false)),
      )
      .orderBy(asc(wallets.name), asc(wallets.id))
      .limit(limit)
      .offset(offset);
  }

  async findById({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .select(WALLET_PUBLIC_COLUMNS)
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  async create({ userId, wallet }: { userId: string; wallet: WalletFormDto }) {
    const rows = await this.db
      .insert(wallets)
      .values({
        name: wallet.name,
        type: wallet.type,
        currencyCode: wallet.currencyCode,
        openingBalanceCents: wallet.openingBalanceCents,
        userId,
      })
      .returning(WALLET_PUBLIC_COLUMNS);

    return rows[0] ?? null;
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
    const set = pickWalletUpdate(patch);

    if (Object.keys(set).length === 0) {
      return this.findById({ id, userId });
    }

    const rows = await this.db
      .update(wallets)
      .set({ ...set, updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning(WALLET_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async archive({ id, userId }: { id: string; userId: string }) {
    const now = new Date();

    const rows = await this.db
      .update(wallets)
      .set({ isArchived: true, archivedAt: now, updatedAt: now })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning(WALLET_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async unarchive({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .update(wallets)
      .set({ isArchived: false, archivedAt: null, updatedAt: new Date() })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning(WALLET_PUBLIC_COLUMNS);

    return rows[0] ?? null;
  }

  async countReferences({ id }: { id: string }) {
    const [occurrences, cards, bills, templateAccounts, templateBillingWallets] =
      await Promise.all([
        this.db.$count(
          transactionOccurrences,
          eq(transactionOccurrences.walletId, id),
        ),
        this.db.$count(creditCards, eq(creditCards.defaultBillingWalletId, id)),
        this.db.$count(
          creditCardBills,
          eq(creditCardBills.billingWalletId, id),
        ),
        this.db.$count(
          transactionTemplates,
          eq(transactionTemplates.defaultAccountId, id),
        ),
        this.db.$count(
          transactionTemplates,
          eq(transactionTemplates.defaultBillingWalletId, id),
        ),
      ]);

    return (
      occurrences + cards + bills + templateAccounts + templateBillingWallets
    );
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    const rows = await this.db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning({ id: wallets.id });

    return rows[0] ?? null;
  }
}
