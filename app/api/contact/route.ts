import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { apiError, bodyJson } from "@/lib/api";
export const runtime="nodejs";
const schema=z.object({name:z.string().min(2).max(120),email:z.string().email().max(200),interest:z.string().min(2).max(120),message:z.string().min(10).max(10000)});
export async function POST(request:Request){try{const input=schema.parse(await bodyJson(request));await query(`INSERT INTO contact_messages (id,name,email,interest,message) VALUES ($1,$2,$3,$4,$5)`,[randomUUID(),input.name,input.email.toLowerCase(),input.interest,input.message]);return Response.json({ok:true},{status:201});}catch(error){return apiError(error)}}
