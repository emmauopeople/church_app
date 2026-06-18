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
  created_at: Date;
};

export async function createGeneratedDocument(params: {
  churchId: string;
  sacramentId: string;
  generatedBy: string;
  fileName: string;
}): Promise<GeneratedDocument> {
  const result = await db.query<GeneratedDocument>(
    `
      INSERT INTO generated_documents (
        church_id,
        document_type,
        reference_entity_type,
        reference_entity_id,
        generated_by,
        file_name
      )
      VALUES ($1, 'SACRAMENT_CARD', 'SACRAMENT', $2, $3, $4)
      RETURNING
        id,
        church_id,
        document_type,
        reference_entity_type,
        reference_entity_id,
        generated_by,
        file_name,
        storage_path,
        created_at
    `,
    [params.churchId, params.sacramentId, params.generatedBy, params.fileName]
  );

  return result.rows[0];
}
