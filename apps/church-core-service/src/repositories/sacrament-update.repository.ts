import { db } from "../config/db.js";
import type { SacramentListItem } from "./sacrament-list.repository.js";

export async function updateSacramentForChurch(params: {
  sacramentId: string;
  churchId: string;
  certificateNumber: string;
  sacramentTypeId: number;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  sponsor1Name: string;
  sponsor2Name: string;
  notes?: string | null;
}): Promise<SacramentListItem | null> {
  const result = await db.query<SacramentListItem>(
    `
      WITH updated AS (
        UPDATE sacraments
        SET
          certificate_number = $3,
          sacrament_type_id = $4,
          sacrament_date = $5,
          place = $6,
          officiant = $7,
          sponsor1_name = $8,
          sponsor2_name = $9,
          notes = $10,
          updated_at = NOW()
        WHERE id = $1
          AND church_id = $2
        RETURNING *
      )
      SELECT
        u.id,
        u.church_id,
        u.member_id,
        m.member_code,
        m.first_name AS member_first_name,
        m.last_name AS member_last_name,
        u.certificate_number,
        u.sacrament_type_id,
        st.name AS sacrament_type_name,
        u.sacrament_date,
        u.place,
        u.officiant,
        u.sponsor1_name,
        u.sponsor2_name,
        u.notes,
        u.created_by,
        u.created_at,
        u.updated_at
      FROM updated u
      INNER JOIN members m ON m.id = u.member_id
      INNER JOIN sacrament_types st ON st.id = u.sacrament_type_id
    `,
    [
      params.sacramentId,
      params.churchId,
      params.certificateNumber,
      params.sacramentTypeId,
      params.sacramentDate,
      params.place ?? null,
      params.officiant ?? null,
      params.sponsor1Name,
      params.sponsor2Name,
      params.notes ?? null
    ]
  );

  return result.rows[0] ?? null;
}
