import { db } from "@budget-manager/db";
import { BudgetRepository, BudgetService } from "./modules/budget";
import { CategoryRepository, CategoryService } from "./modules/category";
import {
  CreditCardRepository,
  CreditCardService,
} from "./modules/credit-card";
import { DashboardRepository, DashboardService } from "./modules/dashboard";
import { RecurringRepository, RecurringService } from "./modules/recurring";
import { TransactionRepository, TransactionService } from "./modules/transaction";
import { WalletRepository, WalletService } from "./modules/wallet";

const walletRepository = new WalletRepository(db);
const categoryRepository = new CategoryRepository(db);
const transactionRepository = new TransactionRepository(db);
const dashboardRepository = new DashboardRepository(db);
const creditCardRepository = new CreditCardRepository(db);
const recurringRepository = new RecurringRepository(db);
const budgetRepository = new BudgetRepository(db);

const walletService = new WalletService(walletRepository);
const categoryService = new CategoryService(categoryRepository);
const creditCardService = new CreditCardService(creditCardRepository);
const transactionService = new TransactionService(
  transactionRepository,
  creditCardService,
);
const budgetService = new BudgetService(budgetRepository);
const dashboardService = new DashboardService(dashboardRepository);
const recurringService = new RecurringService(
  recurringRepository,
  creditCardService,
);

export const services = {
  wallet: walletService,
  category: categoryService,
  transaction: transactionService,
  dashboard: dashboardService,
  creditCard: creditCardService,
  recurring: recurringService,
  budget: budgetService,
};
