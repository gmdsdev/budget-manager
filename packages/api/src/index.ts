import { initTRPC, TRPCError } from "@trpc/server";
import { z, ZodError } from "zod";

import type { Context } from "./context";
import { ConflictError, NotFoundError } from "./errors";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";

    return {
      ...shape,
      message: isInternal
        ? "Something went wrong. Please try again."
        : shape.message,
      data: {
        ...shape.data,
        stack: undefined,
        zodError:
          error.cause instanceof ZodError ? z.flattenError(error.cause) : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

const mapDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();

  if (!result.ok) {
    const cause = result.error.cause;

    if (cause instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: cause.message, cause });
    }

    if (cause instanceof ConflictError) {
      throw new TRPCError({ code: "CONFLICT", message: cause.message, cause });
    }
  }

  return result;
});

const requireSession = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const publicProcedure = t.procedure.use(mapDomainErrors);

export const protectedProcedure = t.procedure
  .use(mapDomainErrors)
  .use(requireSession);
