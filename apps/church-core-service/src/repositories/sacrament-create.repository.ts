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
        $9
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
      params.notes ?? null,
      params.createdBy
    ]
  );

  return result.rows[0] ?? null;
}
