import { z } from "zod";
import { query } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
export const runtime="nodejs";
const schema=z.object({name:z.string().min(2).max(120).optional(),phone:z.string().max(40).optional(),instrument:z.string().max(80).optional(),status:z.enum(["active","pending","inactive"]).optional(),role:z.enum(["member","volunteer_admin","webmaster"]).optional()});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await requireUser(["volunteer_admin","webmaster"]);const {id}=await params;const input=schema.parse(await bodyJson(request));if(input.role&&actor.role!=="webmaster")throw new AuthError("Only a webmaster can change roles",403);const fields=Object.entries(input).filter(([,v])=>v!==undefined);if(fields.length){const values=fields.map(([,v])=>v);values.push(id);await query(`UPDATE users SET ${fields.map(([k],i)=>`${k}=$${i+1}`).join(",")},updated_at=now() WHERE id=$${values.length}`,values);}await audit(actor.id,"user.update","user",id,input);return Response.json({ok:true});}catch(error){return apiError(error)}}
