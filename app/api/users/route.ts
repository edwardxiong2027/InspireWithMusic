import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
export const runtime="nodejs";
export async function GET(){try{await requireUser(["volunteer_admin","webmaster"]);const result=await query(`SELECT u.id,u.email,u.name,u.phone,u.instrument,u.role,u.status,u.created_at::text,COALESCE(sum(CASE WHEN h.status='verified' THEN h.minutes ELSE 0 END),0)::int verified_minutes FROM users u LEFT JOIN service_hours h ON h.user_id=u.id GROUP BY u.id ORDER BY u.name`);return Response.json({users:result.rows});}catch(error){return apiError(error)}}
