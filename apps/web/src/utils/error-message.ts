import { AuthActionError } from "@/lib/auth-error";
import { t } from "@budget-manager/i18n";
import { TRPCClientError } from "@trpc/client";

/**
 * Outside React, so it reads the module-scoped active locale rather than the
 * context — these run from a `QueryCache`/`MutationCache` handler, which has no
 * component to hook into. `AppI18nProvider` keeps that locale current.
 */
// `as const` keeps each value a literal key, so `t` can see that none of them
// takes a placeholder and no params argument is owed.
const BY_CODE = {
  UNAUTHORIZED: "error.client.unauthorized",
  FORBIDDEN: "error.client.forbidden",
  NOT_FOUND: "error.client.notFound",
  TIMEOUT: "error.client.timeout",
  TOO_MANY_REQUESTS: "error.client.tooManyRequests",
} as const;

type ErrorData = {
  code?: string;
  zodError?: {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
  } | null;
};

export function getErrorMessage(error: unknown): string {
  const generic = t("error.client.generic");

  if (error instanceof AuthActionError) {
    return error.message || generic;
  }

  if (!(error instanceof TRPCClientError)) {
    return generic;
  }

  const data = error.data as ErrorData | undefined;
  const zod = data?.zodError;

  if (zod) {
    const firstFieldError = Object.values(zod.fieldErrors).flat().find(Boolean);
    const first = firstFieldError ?? zod.formErrors[0];

    if (first) {
      return first;
    }
  }

  // The server already translated this one, using the locale on the request.
  if (data?.code === "CONFLICT" && error.message) {
    return error.message;
  }

  const code = data?.code;

  return code && code in BY_CODE
    ? t(BY_CODE[code as keyof typeof BY_CODE])
    : generic;
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    (error.data as ErrorData | undefined)?.code === "UNAUTHORIZED"
  );
}
