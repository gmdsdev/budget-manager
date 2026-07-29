import { auth } from "@budget-manager/auth";
import type { Context as HonoContext } from "hono";
import { services } from "./containers";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  return {
    session,
    services,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
