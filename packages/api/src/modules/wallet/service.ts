import type { WalletFormDto } from "@budget-manager/schemas";
import type { WalletRepository } from "./repository";

export class WalletService {
  constructor(private readonly repository: WalletRepository) {}

  async getAll({ userId }: { userId: string }) {
    return await this.repository.getAll({ userId });
  }

  async create({ userId, wallet }: { userId: string; wallet: WalletFormDto }) {
    return await this.repository.create({ userId, wallet });
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
    return await this.repository.update({ id, userId, wallet });
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    return await this.repository.delete({ id, userId });
  }
}
