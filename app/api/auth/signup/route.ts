import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { createSession, hashPassword } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().max(200), password: z.string().min(10).max(200), instrument: z.string().trim().max(80).default("") });

export async function POST(request: Request) {
  try {
    const input = schema.parse(await bodyJson(request));
    const id = randomUUID();
    await query(`INSERT INTO users (id,email,password_hash,name,instrument,role,status) VALUES ($1,$2,$3,$4,$5,'member','active')`, [id, input.email.toLowerCase(), await hashPassword(input.password), input.name, input.instrument]);
    await createSession(id);
    return Response.json({ user: { id, email: input.email.toLowerCase(), name: input.name, instrument: input.instrument, role: "member", status: "active" } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
