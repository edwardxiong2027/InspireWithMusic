import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { AuthError, createSession, hashPassword } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/firebaseAdmin";
import { apiError, bodyJson } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

export const runtime = "nodejs";
const schema = z.object({ idToken: z.string().min(10) });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await bodyJson(request));
    const google = await verifyGoogleIdToken(input.idToken).catch(() => {
      throw new AuthError("Unable to verify Google sign-in", 401);
    });
    const existing = await query<SessionUser>(`SELECT id,email,name,phone,instrument,role,status FROM users WHERE email=$1`, [google.email]);
    let user = existing.rows[0];
    if (!user) {
      const id = randomUUID();
      await query(`INSERT INTO users (id,email,password_hash,name,role,status) VALUES ($1,$2,$3,$4,'member','active')`, [id, google.email, await hashPassword(randomUUID()), google.name]);
      user = { id, email: google.email, name: google.name, phone: "", instrument: "", role: "member", status: "active" };
    }
    if (user.status !== "active") throw new AuthError("This account is not active. Please contact an administrator.", 403);
    await createSession(user.id);
    return Response.json({ user });
  } catch (error) { return apiError(error); }
}
