import { query } from "@/db";
import { storageProvider } from "@/lib/storage";
export const runtime="nodejs";
export async function GET(){try{await query(`SELECT 1 AS ok`);return Response.json({status:"ok",database:"connected",storage:storageProvider()})}catch{return Response.json({status:"error",database:"unavailable"},{status:503})}}
