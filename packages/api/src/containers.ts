import { db } from "@budget-manager/db";
import { WalletService } from "./modules/wallet/service";
import { WalletRepository } from "./modules/wallet/repository";

const walletRepository = new WalletRepository(db);

const walletService = new WalletService(walletRepository);

export const services = {
  wallet: walletService,
};
