import { db } from "@budget-manager/db";
import { WalletRepository, WalletService } from "./modules/wallet";

const walletRepository = new WalletRepository(db);

const walletService = new WalletService(walletRepository);

export const services = {
  wallet: walletService,
};
