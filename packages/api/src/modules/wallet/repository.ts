import type { Db } from "@budget-manager/db";
import { wallets } from "@budget-manager/db/schema/wallet";
import type { CreateWalletDto } from "@budget-manager/schemas";
import { and, eq } from "drizzle-orm";

export class WalletRepository {
  constructor(private readonly db: Db) {}

  async getAll() {
    return await this.db.select().from(wallets);
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
