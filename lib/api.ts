import { ZodError } from "zod";
import { AuthError } from "./auth";

export function apiError(error: unknown) {
  if (error instanceof AuthError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return Response.json({ error: "Please check the highlighted information", details: error.flatten() }, { status: 400 });
  if (error instanceof Error && error.message.includes("duplicate key")) return Response.json({ error: "That record already exists" }, { status: 409 });
  console.error(error);
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}

export async function bodyJson(request: Request) {
  try { return await request.json(); }
  catch { throw new Error("Invalid JSON request"); }
}
