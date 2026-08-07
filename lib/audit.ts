import { randomUUID } from "node:crypto";
import { query } from "@/db";

export async function audit(actorId: string, action: string, entityType: string, entityId: string, details: unknown = {}) {
  await query(`INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,details) VALUES ($1,$2,$3,$4,$5,$6)`, [randomUUID(), actorId, action, entityType, entityId, JSON.stringify(details)]);
}
