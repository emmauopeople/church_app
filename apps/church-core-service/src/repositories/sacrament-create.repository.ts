import { db } from "../config/db.js";

export type CreatedSacrament = {
  id: string;
  church_id: string;
  member_id: string;
  certificate_number: string;
  sacrament_type_id: number;
  sacrament_type_name: string;
  sacrament_date: string;
  place: string | null;
  officiant: string | null;
  sponsor1_name: string | null;
  sponsor2_name: string | null;
  notes: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

type SacramentTypeCodeResult = {
  code: string;
};

type ExistingSacramentResult = {
  id: string;
};

type NextCertificateResult = {
  next_number: string;
};

function normalizeCertificatePrefix(code: string | undefined, sacramentTypeId: number) {
  const normalized = (code ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized || `SAC${sacramentTypeId}`;
}

export async function createSacrament(params: {
  churchId: string;
  memberId: string;
  certificateNumber?: string;
  sacramentTypeId: number;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  sponsor1Name?: string | null;
  sponsor2Name?: string | null;
  notes?: string | null;
  createdBy: string;
}): Promise<CreatedSacrament | null> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${params.churchId}:${params.memberId}:${params.sacramentTypeId}`
    ]);

    const existingSacrament = await client.query<ExistingSacramentResult>(
      `
        SELECT id
        FROM sacraments
        WHERE church_id = $1
          AND member_id = $2
          AND sacrament_type_id = $3
        LIMIT 1
      `,
      [params.churchId, params.memberId, params.sacramentTypeId]
    );

    if (existingSacrament.rowCount && existingSacrament.rowCount > 0) {
      const duplicateError = new Error('This parishioner already has this sacrament type recorded') as Error & { code: string };
      duplicateError.code = 'DUPLICATE_MEMBER_SACRAMENT';
      throw duplicateError;
    }

    let certificateNumber = params.certificateNumber?.trim();

    if (!certificateNumber) {
      const typeResult = await client.query<SacramentTypeCodeResult>(
        `
          SELECT code
          FROM sacrament_types
          WHERE id = $1
        `,
        [params.sacramentTypeId]
      );

      const year = new Date().getFullYear();
      const prefix = `${normalizeCertificatePrefix(typeResult.rows[0]?.code, params.sacramentTypeId)}-${year}`;
      const nextResult = await client.query<NextCertificateResult>(
        `
          SELECT COALESCE(MAX((substring(certificate_number from '-([0-9]+)$'))::int), 0) + 1 AS next_number
          FROM sacraments
          WHERE church_id = $1
            AND sacrament_type_id = $2
            AND certificate_number LIKE $3
        `,
        [params.churchId, params.sacramentTypeId, `${prefix}-%`]
      );

      const nextNumber = Number(nextResult.rows[0]?.next_number ?? 1);
      certificateNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    }

    const result = await client.query<CreatedSacrament>(
      `
        INSERT INTO sacraments (
          church_id,
          member_id,
          certificate_number,
          sacrament_type_id,
          sacrament_date,
          place,
          officiant,
          sponsor1_name,
          sponsor2_name,
          notes,
          created_by
        )
        SELECT
          $1,
          m.id,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        FROM members m
        WHERE m.id = $2
          AND m.church_id = $1
        RETURNING
          id,
          church_id,
          member_id,
          certificate_number,
          sacrament_type_id,
          (
            SELECT name
            FROM sacrament_types
            WHERE id = $4
          ) AS sacrament_type_name,
          sacrament_date,
          place,
          officiant,
          sponsor1_name,
          sponsor2_name,
          notes,
          created_by,
          created_at,
          updated_at
      `,
      [
        params.churchId,
        params.memberId,
        certificateNumber,
        params.sacramentTypeId,
        params.sacramentDate,
        params.place ?? null,
        params.officiant ?? null,
        params.sponsor1Name ?? null,
        params.sponsor2Name ?? null,
        params.notes ?? null,
        params.createdBy
      ]
    );

    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
