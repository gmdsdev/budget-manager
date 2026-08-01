import { MonthKeySchema } from "@budget-manager/schemas";
import { z } from "zod";

export const DashboardSummaryInput = z
  .object({ month: MonthKeySchema.optional() })
  .prefault({});

export type DashboardSummaryDto = z.infer<typeof DashboardSummaryInput>;
