import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "@/db";
import { apiError, bodyJson } from "@/lib/api";
export const runtime="nodejs";
export async function POST(request:Request){try{const {email}=z.object({email:z.string().email().max(200)}).parse(await bodyJson(request));await query(`INSERT INTO newsletter_subscribers (id,email,status) VALUES ($1,$2,'active') ON CONFLICT (email) DO UPDATE SET status='active'`,[randomUUID(),email.toLowerCase()]);return Response.json({ok:true},{status:201});}catch(error){return apiError(error)}}
