import { randomUUID } from "node:crypto";
import { query } from "@/db";
import { AuthError, requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { storeMedia } from "@/lib/storage";
export const runtime="nodejs";
const allowed=new Map([["image/jpeg",".jpg"],["image/png",".png"],["image/webp",".webp"],["image/gif",".gif"]]);
export async function GET(){try{await requireUser(["webmaster"]);const result=await query(`SELECT * FROM media_assets ORDER BY created_at DESC`);return Response.json({assets:result.rows});}catch(error){return apiError(error)}}
export async function POST(request:Request){try{const user=await requireUser(["webmaster"]);const form=await request.formData();const file=form.get("file");const altText=String(form.get("altText")??"").slice(0,300);if(!(file instanceof File))throw new AuthError("Choose an image to upload",400);const extension=allowed.get(file.type);if(!extension)throw new AuthError("Upload a JPG, PNG, WebP, or GIF image",400);if(file.size>10*1024*1024)throw new AuthError("Images must be 10 MB or smaller",400);const key=`${randomUUID()}${extension}`;const bytes=new Uint8Array(await file.arrayBuffer());const publicUrl=await storeMedia(key,bytes,file.type);const id=randomUUID();await query(`INSERT INTO media_assets (id,filename,storage_key,public_url,mime_type,byte_size,alt_text,uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[id,file.name,key,publicUrl,file.type,file.size,altText,user.id]);return Response.json({asset:{id,filename:file.name,storage_key:key,public_url:publicUrl,mime_type:file.type,byte_size:file.size,alt_text:altText}},{status:201});}catch(error){return apiError(error)}}
