import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import type { ServiceHourRecord } from "@/lib/types";
export const runtime="nodejs";
const schema=z.object({eventId:z.string().uuid().nullable().optional(),activity:z.string().trim().min(2).max(180),serviceDate:z.string().date(),minutes:z.coerce.number().int().min(1).max(1440),notes:z.string().max(3000).default("")});
export async function GET(){try{const user=await requireUser();const admin=user.role!=="member";const result=await query<ServiceHourRecord>(`SELECT h.*,u.name member_name,u.email member_email FROM service_hours h JOIN users u ON u.id=h.user_id WHERE ($1::boolean OR h.user_id=$2) ORDER BY h.service_date DESC,h.created_at DESC`,[admin,user.id]);return Response.json({hours:result.rows});}catch(error){return apiError(error)}}
export async function POST(request:Request){try{const user=await requireUser();const input=schema.parse(await bodyJson(request));const id=randomUUID();await query(`INSERT INTO service_hours (id,user_id,event_id,activity,service_date,minutes,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,[id,user.id,input.eventId??null,input.activity,input.serviceDate,input.minutes,input.notes]);return Response.json({id},{status:201});}catch(error){return apiError(error)}}
