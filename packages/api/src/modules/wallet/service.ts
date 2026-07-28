import type { CreateWalletDto } from "@budget-manager/schemas";
import type { WalletRepository } from "./repository";

export class WalletService {
  constructor(private readonly repository: WalletRepository) {}

  async getAll({ userId }: { userId: string }) {
    return await this.repository.getAll({ userId });
  }

  async create({
    userId,
    wallet,
  }: {
    userId: string;
    wallet: CreateWalletDto;
  }) {
    return await this.repository.create({ userId, wallet });
  }

  async delete({ id, userId }: { id: string; userId: string }) {
    return await this.repository.delete({ id, userId });
  }
}
