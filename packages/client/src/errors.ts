import { t } from "@budget-manager/i18n";
import { TRPCClientError } from "@trpc/client";

/**
 * better-auth returns `{ data, error }` rather than throwing, so a mutation that
 * read `error` inline would resolve successfully and never fire the shared
 * `MutationCache` toast. Everything calling better-auth from a mutation goes
 * through {@link runAuthAction}, and the error it throws is what
 * {@link getErrorMessage} special-cases to surface the library's own copy
 * ("Invalid password") instead of the generic string.
 */
export class AuthActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthActionError";
  }
}

type AuthActionResult<TData> = {
  data: TData | null;
  error: { message?: string; statusText?: string } | null;
};

export async function runAuthAction<TData>(
  action: Promise<AuthActionResult<TData>>,
): Promise<TData> {
  const { data, error } = await action;

  if (error) {
    throw new AuthActionError(
      error.message ?? error.statusText ?? t("error.client.generic"),
    );
  }

  return data as TData;
}

/**
 * Read through the module-scoped translator rather than a hook: these run from a
 * `QueryCache`/`MutationCache` handler, which has no component to hook into. Each
 * app's i18n provider keeps that locale current.
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
  subscriptionRequired?: boolean;
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

  // The server already translated these, using the locale on the request.
  if ((data?.code === "CONFLICT" || data?.subscriptionRequired) && error.message) {
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

export function isSubscriptionRequiredError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    (error.data as ErrorData | undefined)?.subscriptionRequired === true
  );
}
