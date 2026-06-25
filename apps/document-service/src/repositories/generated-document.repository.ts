import { db } from "../config/db.js";

export type GeneratedDocument = {
  id: string;
  church_id: string;
  document_type: "SACRAMENT_CARD" | "MEMBER_INFO";
  reference_entity_type: "MEMBER" | "SACRAMENT";
  reference_entity_id: string;
  generated_by: string;
  file_name: string | null;
  storage_path: string | null;
  action: CertificateDocumentAction;
  created_at: Date;
};

export type CertificateDocumentAction = "HTML_PREVIEW" | "PDF_PREVIEW" | "PDF_DOWNLOAD" | "GENERATE_PDF";

export async function createGeneratedDocument(params: {
  churchId: string;
  sacramentId: string;
  generatedBy: string;
  fileName: string;
  action?: CertificateDocumentAction;
}): Promise<GeneratedDocument> {
  const result = await db.query<GeneratedDocument>(
    `
      INSERT INTO generated_documents (
        church_id,
        document_type,
        reference_entity_type,
        reference_entity_id,
        generated_by,
        file_name,
        action
      )
      VALUES ($1, 'SACRAMENT_CARD', 'SACRAMENT', $2, $3, $4, $5)
      RETURNING
        id,
        church_id,
        document_type,
        reference_entity_type,
        reference_entity_id,
        generated_by,
        file_name,
        storage_path,
        action,
        created_at
    `,
    [
      params.churchId,
      params.sacramentId,
      params.generatedBy,
      params.fileName,
      params.action ?? "GENERATE_PDF"
    ]
  );

  return result.rows[0];
}

export async function listGeneratedCertificateLogs(params: {
  churchId: string;
  limit?: number;
}): Promise<GeneratedDocument[]> {
  const result = await db.query<GeneratedDocument>(
    `
      SELECT
        id,
        church_id,
        document_type,
        reference_entity_type,
        reference_entity_id,
        generated_by,
        file_name,
        storage_path,
        action,
        created_at
      FROM generated_documents
      WHERE church_id = $1
        AND document_type = 'SACRAMENT_CARD'
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [
      params.churchId,
      params.limit ?? 100
    ]
  );

  return result.rows;
}
