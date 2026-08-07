import path from "node:path";
import { readMedia } from "@/lib/storage";
export const runtime="nodejs";
const types:{[key:string]:string}={".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",".gif":"image/gif"};
export async function GET(_:Request,{params}:{params:Promise<{key:string}>}){try{const {key}=await params;if(!/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(key))return new Response("Not found",{status:404});const file=await readMedia(key);return new Response(file.bytes as BodyInit,{headers:{"content-type":file.contentType??types[path.extname(key).toLowerCase()]??"application/octet-stream","cache-control":"public, max-age=31536000, immutable"}});}catch{return new Response("Not found",{status:404})}}
