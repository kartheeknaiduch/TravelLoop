import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import path from "node:path";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
