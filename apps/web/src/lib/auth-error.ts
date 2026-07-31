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
      error.message ?? error.statusText ?? "Something went wrong.",
    );
  }

  return data as TData;
}
