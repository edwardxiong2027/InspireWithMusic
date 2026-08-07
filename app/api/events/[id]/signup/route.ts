import { randomUUID } from "node:crypto";
import { query } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
export const runtime = "nodejs";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser();const {id}=await params;const found=await query<{status:string;capacity:number;signup_count:number}>(`SELECT e.status,e.capacity,count(s.id)::int signup_count FROM events e LEFT JOIN event_signups s ON s.event_id=e.id AND s.status='signed_up' WHERE e.id=$1 GROUP BY e.id`,[id]);const event=found.rows[0];if(!event||event.status!=="open")throw new AuthError("This event is not open for signup",409);if(event.signup_count>=event.capacity)throw new AuthError("This event is full",409);await query(`INSERT INTO event_signups (id,event_id,user_id,status) VALUES ($1,$2,$3,'signed_up') ON CONFLICT (event_id,user_id) DO UPDATE SET status='signed_up',created_at=now()`,[randomUUID(),id,user.id]);return Response.json({ok:true});}catch(error){return apiError(error)}}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser();const {id}=await params;await query(`UPDATE event_signups SET status='cancelled' WHERE event_id=$1 AND user_id=$2`,[id,user.id]);return Response.json({ok:true});}catch(error){return apiError(error)}}
