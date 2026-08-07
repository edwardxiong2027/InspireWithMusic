import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
export const runtime="nodejs";
export async function GET(){try{await requireUser(["webmaster"]);const result=await query(`SELECT * FROM contact_messages ORDER BY created_at DESC`);return Response.json({messages:result.rows});}catch(error){return apiError(error)}}
