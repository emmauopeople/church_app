import { db } from "./db.js";

export async function ensureAuthTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS auth_activity_logs (
      id BIGSERIAL PRIMARY KEY,
      church_id UUID,
      user_id UUID,
      email_attempted TEXT,
      action VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      failure_reason TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_activity_logs_church_created
      ON auth_activity_logs (church_id, created_at DESC)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_activity_logs_user_created
      ON auth_activity_logs (user_id, created_at DESC)
  `);
}
