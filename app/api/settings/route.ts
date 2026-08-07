import { z } from "zod";
import { query } from "@/db";
import { requireUser } from "@/lib/auth";
import { apiError, bodyJson } from "@/lib/api";
import { audit } from "@/lib/audit";
import { storageProvider } from "@/lib/storage";
export const runtime="nodejs";
const schema=z.object({settings:z.record(z.string().max(120),z.string().max(5000))});
export async function GET(){try{await requireUser(["webmaster"]);const result=await query<{key:string;value:string;is_public:boolean}>(`SELECT key,value,is_public FROM site_settings ORDER BY key`);return Response.json({settings:Object.fromEntries(result.rows.map(x=>[x.key,x.value])),database:{provider:process.env.DATABASE_URL?"Amazon RDS/Aurora PostgreSQL":"Local PostgreSQL-compatible storage",connected:true},storage:{provider:storageProvider()}});}catch(error){return apiError(error)}}
export async function PUT(request:Request){try{const user=await requireUser(["webmaster"]);const input=schema.parse(await bodyJson(request));for(const [key,value] of Object.entries(input.settings))await query(`INSERT INTO site_settings (key,value,is_public,updated_by) VALUES ($1,$2,false,$3) ON CONFLICT (key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()`,[key,value,user.id]);await audit(user.id,"settings.update","settings","site",{keys:Object.keys(input.settings)});return Response.json({ok:true});}catch(error){return apiError(error)}}
