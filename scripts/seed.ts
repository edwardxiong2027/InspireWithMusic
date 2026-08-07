import { randomUUID } from "node:crypto";
import { initializeDatabase, query, closeDatabase } from "../db/index";
import { hashPassword } from "../lib/auth";

await initializeDatabase();

async function upsertUser(email: string, password: string, name: string, role: string, instrument = "") {
  const passwordHash = await hashPassword(password);
  await query(
    `INSERT INTO users (id,email,password_hash,name,role,status,instrument)
     VALUES ($1,$2,$3,$4,$5,'active',$6)
     ON CONFLICT (email) DO UPDATE SET password_hash=excluded.password_hash,name=excluded.name,role=excluded.role,status='active',instrument=excluded.instrument,updated_at=now()`,
    [randomUUID(), email.toLowerCase(), passwordHash, name, role, instrument],
  );
}

const localOnly = process.env.NODE_ENV !== "production";
const webmasterEmail = process.env.SEED_WEBMASTER_EMAIL ?? "webmaster@inspirewithmusic.org";
const webmasterPassword = process.env.SEED_WEBMASTER_PASSWORD ?? (localOnly ? "ChangeMe-Webmaster-2026!" : "");
const volunteerAdminEmail = process.env.SEED_VOLUNTEER_ADMIN_EMAIL ?? "volunteer-admin@inspirewithmusic.org";
const volunteerAdminPassword = process.env.SEED_VOLUNTEER_ADMIN_PASSWORD ?? (localOnly ? "ChangeMe-Volunteer-2026!" : "");

if (!webmasterPassword || !volunteerAdminPassword) throw new Error("Administrator seed passwords are required in production.");

await upsertUser(webmasterEmail, webmasterPassword, "Webmaster", "webmaster");
await upsertUser(volunteerAdminEmail, volunteerAdminPassword, "Volunteer Administrator", "volunteer_admin");
await upsertUser("member@inspirewithmusic.org", "ChangeMe-Member-2026!", "Alex Morgan", "member", "Violin");

const admin = await query<{ id: string }>(`SELECT id FROM users WHERE email=$1`, [volunteerAdminEmail.toLowerCase()]);
const creatorId = admin.rows[0]?.id;
const existing = await query<{ count: string }>(`SELECT count(*)::text AS count FROM events`);
if (Number(existing.rows[0]?.count ?? 0) === 0) {
  const samples = [
    ["Summer Music Exchange Sorting Day", "Sort and prepare donated scores for local learners.", "Yorba Linda Community Center", "2026-08-24T17:00:00Z", "2026-08-24T20:00:00Z", 30, 180],
    ["Young Strings Workshop", "Help beginning string players build confidence and play together.", "OC Music & Dance", "2026-09-07T21:00:00Z", "2026-09-07T23:30:00Z", 20, 150],
    ["Sunset Senior Center Performance", "Share an afternoon chamber performance with senior residents.", "Placentia, CA", "2026-09-21T22:30:00Z", "2026-09-22T00:00:00Z", 15, 90],
  ];
  for (const event of samples) await query(`INSERT INTO events (id,title,description,location,starts_at,ends_at,capacity,service_minutes,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'open',$9)`, [randomUUID(), ...event, creatorId]);
}

console.log("Local accounts are ready:");
console.log(`  Webmaster: ${webmasterEmail} / ${webmasterPassword}`);
console.log(`  Volunteer admin: ${volunteerAdminEmail} / ${volunteerAdminPassword}`);
console.log("  Member: member@inspirewithmusic.org / ChangeMe-Member-2026!");
await closeDatabase();
