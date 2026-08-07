import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { getSessionUser, requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
export const runtime="nodejs";
const schema=z.object({title:z.string().trim().min(5).max(200),excerpt:z.string().max(500).default(""),body:z.string().trim().min(40).max(40000),coverUrl:z.string().max(1000).default("")});
export async function GET(){try{const user=await getSessionUser();const isAdmin=Boolean(user&&user.role!=="member");const result=await query(`SELECT s.*,u.name author_name FROM stories s JOIN users u ON u.id=s.author_id WHERE s.status='published' OR ($1::boolean) OR ($2::text IS NOT NULL AND s.author_id::text=$2::text) ORDER BY COALESCE(s.published_at,s.created_at) DESC`,[isAdmin,user?.id??null]);return Response.json({stories:result.rows});}catch(error){return apiError(error)}}
export async function POST(request:Request){try{const user=await requireUser();const input=schema.parse(await bodyJson(request));const id=randomUUID();await query(`INSERT INTO stories (id,author_id,title,excerpt,body,cover_url,status) VALUES ($1,$2,$3,$4,$5,$6,'submitted')`,[id,user.id,input.title,input.excerpt,input.body,input.coverUrl]);return Response.json({id},{status:201});}catch(error){return apiError(error)}}
