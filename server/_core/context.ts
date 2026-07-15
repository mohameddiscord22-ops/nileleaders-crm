import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSessionTokenFromRequest, verifySessionToken } from "../localAuth";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 1. Try local session auth first
    const token = getSessionTokenFromRequest(opts.req);
    const session = await verifySessionToken(token);
    if (session?.userId) {
      user = await getUserById(session.userId) ?? null;
    }

    // 2. Fallback to SDK/OAuth auth if local fails AND OAuth is configured
    if (!user && process.env.OAUTH_SERVER_URL) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
