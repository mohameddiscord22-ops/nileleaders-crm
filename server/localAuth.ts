import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { parse as parseCookieHeader } from "cookie";

/**
 * Local username/password auth helpers.
 * Replaces the Manus OAuth-based sdk.ts flow for this app.
 */

export const LOCAL_COOKIE_NAME = "session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// IMPORTANT: set SESSION_SECRET in your environment variables in production.
// Falls back to a dev-only secret so local testing works out of the box.
function getSecretKey() {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(userId: number, expiresInMs = ONE_YEAR_MS): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<{ userId: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const userId = payload.userId;
    if (typeof userId !== "number") return null;
    return { userId };
  } catch (error) {
    return null;
  }
}

export function getSessionTokenFromRequest(req: Request): string | undefined {
  const cookies = req.headers.cookie ? parseCookieHeader(req.headers.cookie) : {};
  let token = cookies[LOCAL_COOKIE_NAME];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  return token;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR_MS,
  };
}
