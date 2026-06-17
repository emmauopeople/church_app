import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});
