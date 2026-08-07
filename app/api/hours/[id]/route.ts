import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
export const runtime="nodejs";
const schema=z.object({status:z.enum(["verified","rejected"])});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser(["volunteer_admin","webmaster"]);const {id}=await params;const input=schema.parse(await bodyJson(request));await query(`UPDATE service_hours SET status=$1,verified_by=$2,verified_at=now() WHERE id=$3`,[input.status,user.id,id]);await audit(user.id,`hours.${input.status}`,"service_hour",id);return Response.json({ok:true});}catch(error){return apiError(error)}}
