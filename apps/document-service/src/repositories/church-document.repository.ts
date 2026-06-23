import { ensureDocumentTables } from "../config/bootstrap.js";
import { db } from "../config/db.js";

export type ChurchDocument = {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  category: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  file_content?: Buffer;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
  total_count?: string;
};

export type ChurchDocumentSummary = Omit<ChurchDocument, "file_content" | "total_count">;

let tableReadyPromise: Promise<void> | null = null;

async function ensureReady() {
  tableReadyPromise ??= ensureDocumentTables();
  await tableReadyPromise;
}

export async function createChurchDocument(params: {
  churchId: string;
  title: string;
  description?: string | null;
  category: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  fileContent: Buffer;
  uploadedBy: string;
}): Promise<ChurchDocumentSummary> {
  await ensureReady();

  const result = await db.query<ChurchDocumentSummary>(
    `
      INSERT INTO church_documents (
        church_id,
        title,
        description,
        category,
        original_file_name,
        mime_type,
        size_bytes,
        file_content,
        uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        church_id,
        title,
        description,
        category,
        original_file_name,
        mime_type,
        size_bytes,
        uploaded_by,
        created_at,
        updated_at
    `,
    [
      params.churchId,
      params.title,
      params.description ?? null,
      params.category,
      params.originalFileName,
      params.mimeType,
      params.sizeBytes,
      params.fileContent,
      params.uploadedBy
    ]
  );

  return result.rows[0];
}

export async function listChurchDocuments(params: {
  churchId: string;
  search?: string;
  category?: string;
  limit: number;
  offset: number;
}): Promise<{ documents: ChurchDocumentSummary[]; total: number }> {
  await ensureReady();

  const values: Array<string | number> = [params.churchId];
  const conditions = ["church_id = $1"];

  if (params.search) {
    values.push(`%${params.search.toLowerCase()}%`);
    conditions.push(`(
      LOWER(title) LIKE $${values.length}
      OR LOWER(COALESCE(description, '')) LIKE $${values.length}
      OR LOWER(original_file_name) LIKE $${values.length}
    )`);
  }

  if (params.category) {
    values.push(params.category);
    conditions.push(`category = $${values.length}`);
  }

  values.push(params.limit);
  const limitPlaceholder = `$${values.length}`;
  values.push(params.offset);
  const offsetPlaceholder = `$${values.length}`;

  const result = await db.query<ChurchDocument>(
    `
      SELECT
        id,
        church_id,
        title,
        description,
        category,
        original_file_name,
        mime_type,
        size_bytes,
        uploaded_by,
        created_at,
        updated_at,
        COUNT(*) OVER() AS total_count
      FROM church_documents
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `,
    values
  );

  const documents = result.rows.map(({ total_count, ...document }) => document);
  const total = Number(result.rows[0]?.total_count ?? 0);

  return { documents, total };
}

export async function findChurchDocumentById(params: {
  churchId: string;
  documentId: string;
}): Promise<ChurchDocument | null> {
  await ensureReady();

  const result = await db.query<ChurchDocument>(
    `
      SELECT
        id,
        church_id,
        title,
        description,
        category,
        original_file_name,
        mime_type,
        size_bytes,
        file_content,
        uploaded_by,
        created_at,
        updated_at
      FROM church_documents
      WHERE church_id = $1
        AND id = $2
      LIMIT 1
    `,
    [params.churchId, params.documentId]
  );

  return result.rows[0] ?? null;
}
