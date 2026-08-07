import { createHash, randomBytes, randomUUID, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query } from "@/db";
import type { Role, SessionUser } from "./types";

const scrypt = promisify(nodeScrypt);
export const SESSION_COOKIE = "iwm_session";
const SESSION_DAYS = 14;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await query(`INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,$4)`, [randomUUID(), userId, tokenHash(token), expires.toISOString()]);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await query(`DELETE FROM sessions WHERE token_hash=$1`, [tokenHash(token)]);
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await query<SessionUser>(
    `SELECT u.id,u.email,u.name,u.phone,u.instrument,u.role,u.status
     FROM sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at > now()`,
    [tokenHash(token)],
  );
  const user = result.rows[0] ?? null;
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Authentication required", 401);
  if (roles && !roles.includes(user.role)) throw new AuthError("You do not have permission for this action", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}
