import type { Db } from "@budget-manager/db";
import { wallets } from "@budget-manager/db/schema/wallet";
import type { WalletFormDto } from "@budget-manager/schemas";
import { and, asc, eq } from "drizzle-orm";

export class WalletRepository {
  constructor(private readonly db: Db) {}

  async getAll({ userId }: { userId: string }) {
    return this.db
      .select({
        id: wallets.id,
        name: wallets.name,
        type: wallets.type,
        openingBalanceCents: wallets.openingBalanceCents,
        currentBalanceCents: wallets.currentBalanceCents,
        currency: wallets.currencyCode,
        createdAt: wallets.createdAt,
        updatedAt: wallets.updatedAt,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(asc(wallets.name));
  }

  async update({
    id,
    userId,
    wallet,
  }: {
    id: string;
    userId: string;
    wallet: WalletFormDto;
  }) {
    return await this.db
      .update(wallets)
      .set({
        ...wallet,
        userId,
      })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
  }

  async create({ userId, wallet }: { userId: string; wallet: WalletFormDto }) {
    return await this.db.insert(wallets).values({
      ...wallet,
      userId,
    });
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    return await this.db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
  }
}
