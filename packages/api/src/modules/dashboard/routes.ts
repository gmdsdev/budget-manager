import { protectedProcedure, router } from "../../index";
import { DashboardSummaryInput } from "./validators";

export const dashboardRouter = router({
  getSummary: protectedProcedure
    .input(DashboardSummaryInput)
    .query(async ({ input, ctx }) => {
      return await ctx.services.dashboard.getSummary({
        userId: ctx.session.user.id,
        month: input.month,
      });
    }),
});
