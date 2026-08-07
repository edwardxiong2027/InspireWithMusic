import { z } from "zod";
import { query } from "@/db";
import { AuthError, createSession, verifyPassword } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await bodyJson(request));
    const result = await query<SessionUser & { password_hash: string }>(`SELECT id,email,password_hash,name,phone,instrument,role,status FROM users WHERE email=$1`, [input.email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(input.password, user.password_hash))) throw new AuthError("Email or password is incorrect", 401);
    if (user.status !== "active") throw new AuthError("This account is not active. Please contact an administrator.", 403);
    await createSession(user.id);
    const { password_hash, ...safeUser } = user;
    void password_hash;
    return Response.json({ user: safeUser });
  } catch (error) { return apiError(error); }
}
