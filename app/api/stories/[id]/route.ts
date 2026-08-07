import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
export const runtime="nodejs";
const schema=z.object({status:z.enum(["submitted","published","rejected"])});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireUser(["webmaster"]);const {id}=await params;const input=schema.parse(await bodyJson(request));await query(`UPDATE stories SET status=$1,reviewer_id=$2,published_at=CASE WHEN $1='published' THEN now() ELSE published_at END,updated_at=now() WHERE id=$3`,[input.status,user.id,id]);await audit(user.id,`story.${input.status}`,"story",id);return Response.json({ok:true});}catch(error){return apiError(error)}}
