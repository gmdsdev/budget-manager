import { TRPCClientError } from "@trpc/client";

const GENERIC = "Something went wrong. Please try again.";

const BY_CODE: Record<string, string> = {
  UNAUTHORIZED: "Your session expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That item no longer exists.",
  TIMEOUT: "The request took too long. Please try again.",
  TOO_MANY_REQUESTS: "Too many requests. Please wait a moment.",
};

type ErrorData = {
  code?: string;
  zodError?: {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
  } | null;
};

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof TRPCClientError)) {
    return GENERIC;
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

  if (data?.code === "CONFLICT" && error.message) {
    return error.message;
  }

  if (data?.code && data.code in BY_CODE) {
    return BY_CODE[data.code]!;
  }

  return GENERIC;
}

export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    (error.data as ErrorData | undefined)?.code === "UNAUTHORIZED"
  );
}
