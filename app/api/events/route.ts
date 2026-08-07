import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { getSessionUser, requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
import type { EventRecord } from "@/lib/types";

export const runtime = "nodejs";
const eventSchema = z.object({ title: z.string().trim().min(3).max(180), description: z.string().max(5000).default(""), location: z.string().trim().min(2).max(240), startsAt: z.string().datetime(), endsAt: z.string().datetime(), capacity: z.coerce.number().int().min(1).max(1000), serviceMinutes: z.coerce.number().int().min(0).max(1440), status: z.enum(["draft","open","closed","completed","cancelled"]).default("open") }).refine(v => new Date(v.endsAt) > new Date(v.startsAt), { message: "End time must be after start time", path: ["endsAt"] });

export async function GET() {
  try {
    const user = await getSessionUser();
    const result = await query<EventRecord>(
      `SELECT e.*, count(s.id)::int AS signup_count,
       CASE WHEN $1::text IS NULL THEN false ELSE bool_or(s.user_id::text=$1::text AND s.status='signed_up') END AS is_signed_up
       FROM events e LEFT JOIN event_signups s ON s.event_id=e.id
       WHERE e.status <> 'draft' OR $2::boolean
       GROUP BY e.id ORDER BY e.starts_at ASC`,
      [user?.id ?? null, Boolean(user && user.role !== "member")],
    );
    return Response.json({ events: result.rows });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["volunteer_admin","webmaster"]);
    const input = eventSchema.parse(await bodyJson(request));
    const id = randomUUID();
    await query(`INSERT INTO events (id,title,description,location,starts_at,ends_at,capacity,service_minutes,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [id,input.title,input.description,input.location,input.startsAt,input.endsAt,input.capacity,input.serviceMinutes,input.status,user.id]);
    await audit(user.id,"event.create","event",id,input);
    return Response.json({ id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
