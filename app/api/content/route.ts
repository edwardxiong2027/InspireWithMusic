import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
import type { ContentEntry } from "@/lib/types";

export const runtime = "nodejs";
const updateSchema = z.object({ entries: z.array(z.object({ key: z.string().min(1).max(120), value: z.string().max(20000) })).min(1).max(200) });

export async function GET() {
  try {
    const result = await query<ContentEntry>(`SELECT key,value,page,label,field_type,updated_at::text FROM content_entries ORDER BY page,label`);
    return Response.json({ entries: result.rows, content: Object.fromEntries(result.rows.map(row => [row.key, row.value])) });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(["webmaster"]);
    const input = updateSchema.parse(await bodyJson(request));
    for (const entry of input.entries) await query(`UPDATE content_entries SET value=$1,updated_by=$2,updated_at=now() WHERE key=$3`, [entry.value, user.id, entry.key]);
    await audit(user.id, "content.update", "content", "bulk", { keys: input.entries.map(entry => entry.key) });
    return Response.json({ ok: true });
  } catch (error) { return apiError(error); }
}
