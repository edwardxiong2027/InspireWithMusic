import { initializeDatabase, closeDatabase } from "../db/index";

await initializeDatabase();
console.log("Database schema is ready.");
await closeDatabase();
