import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
export const runtime="nodejs";
const schema=z.object({name:z.string().min(2).max(120),phone:z.string().max(40),instrument:z.string().max(80)});
export async function PATCH(request:Request){try{const user=await requireUser();const input=schema.parse(await bodyJson(request));await query(`UPDATE users SET name=$1,phone=$2,instrument=$3,updated_at=now() WHERE id=$4`,[input.name,input.phone,input.instrument,user.id]);return Response.json({ok:true});}catch(error){return apiError(error)}}
