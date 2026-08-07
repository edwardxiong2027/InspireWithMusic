import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() { return Response.json({ user: await getSessionUser() }); }
