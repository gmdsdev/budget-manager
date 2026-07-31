import {
  DEFAULT_LOCALE,
  type Locale,
  translate,
  translateMessage,
} from "@budget-manager/i18n";
import { initTRPC, TRPCError } from "@trpc/server";
import { z, ZodError } from "zod";

import type { Context } from "./context";
import { ConflictError, type DomainError, NotFoundError } from "./errors";

/**
 * Translating here rather than in the service is what keeps the server free of
 * a process-wide "current language": the locale is a value on the request, so
 * two concurrent requests in two languages cannot read each other's.
 *
 * The Zod messages in `@budget-manager/schemas` are the deliberate exception —
 * they resolve against the module-scoped active locale, which the server never
 * sets, so a `zodError` payload is always English. That payload only reaches a
 * caller who bypassed the client-side validator, since the web app validates
 * with the same schema, in the reader's own language, before sending anything.
 */
function messageFor(error: DomainError, locale: Locale) {
  return translateMessage(locale, error.messageKey, error.params);
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error, ctx }) {
    const isInternal = error.code === "INTERNAL_SERVER_ERROR";
    const locale = ctx?.locale ?? DEFAULT_LOCALE;

    return {
      ...shape,
      message: isInternal
        ? translate(locale, "error.client.generic")
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

const mapDomainErrors = t.middleware(async ({ ctx, next }) => {
  const result = await next();

  if (!result.ok) {
    const cause = result.error.cause;

    if (cause instanceof NotFoundError) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: messageFor(cause, ctx.locale),
        cause,
      });
    }

    if (cause instanceof ConflictError) {
      throw new TRPCError({
        code: "CONFLICT",
        message: messageFor(cause, ctx.locale),
        cause,
      });
    }
  }

  return result;
});

const requireSession = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: translate(ctx.locale, "error.authenticationRequired"),
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
