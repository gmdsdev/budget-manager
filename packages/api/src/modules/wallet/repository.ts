import type { Db } from "@budget-manager/db";
import { wallets } from "@budget-manager/db/schema/wallet";
import type { CreateWalletDto } from "@budget-manager/schemas";
import { and, asc, eq } from "drizzle-orm";

export class WalletRepository {
  constructor(private readonly db: Db) {}

  async getAll({ userId }: { userId: string }) {
    return this.db
      .select({
        id: wallets.id,
        name: wallets.name,
        type: wallets.type,
        balance: wallets.currentBalanceCents,
        currency: wallets.currencyCode,
        createdAt: wallets.createdAt,
        updatedAt: wallets.updatedAt,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(asc(wallets.name));
  }

  async create({
    userId,
    wallet,
  }: {
    userId: string;
    wallet: CreateWalletDto;
  }) {
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
