import { budgetRouter } from "../modules/budget";
import { categoryRouter } from "../modules/category";
import { creditCardRouter } from "../modules/credit-card";
import { dashboardRouter } from "../modules/dashboard";
import { recurringRouter } from "../modules/recurring";
import { transactionRouter } from "../modules/transaction";
import { walletRouter } from "../modules/wallet";
import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  wallet: walletRouter,
  category: categoryRouter,
  transaction: transactionRouter,
  dashboard: dashboardRouter,
  creditCard: creditCardRouter,
  recurring: recurringRouter,
  budget: budgetRouter,
});
export type AppRouter = typeof appRouter;
