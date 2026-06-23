import { db } from "./db.js";

export async function ensureDocumentTables() {
  await db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS church_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      church_id UUID NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
      original_file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      file_content BYTEA NOT NULL,
      uploaded_by UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_church_documents_church_created
      ON church_documents (church_id, created_at DESC)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_church_documents_church_category
      ON church_documents (church_id, category, created_at DESC)
  `);
}
