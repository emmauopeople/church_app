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

export async function createSacrament(params: {
  churchId: string;
  memberId: string;
  certificateNumber: string;
  sacramentTypeId: number;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  sponsor1Name?: string | null;
  sponsor2Name?: string | null;
  notes?: string | null;
  createdBy: string;
}): Promise<CreatedSacrament | null> {
  const result = await db.query<CreatedSacrament>(
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
      params.certificateNumber,
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

  return result.rows[0] ?? null;
}
