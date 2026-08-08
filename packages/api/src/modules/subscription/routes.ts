import { protectedProcedure, router } from "../../index";

export const subscriptionRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.subscription.getStatus({
      userId: ctx.session.user.id,
    });
  }),
});
