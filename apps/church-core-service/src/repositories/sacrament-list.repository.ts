import { db } from "../config/db.js";

export type SacramentListItem = {
  id: string;
  church_id: string;
  member_id: string;
  member_code: string;
  member_first_name: string;
  member_last_name: string;
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

export async function listSacramentsByChurch(params: {
  churchId: string;
  memberId?: string;
  sacramentTypeId?: number;
  limit: number;
  offset: number;
}): Promise<SacramentListItem[]> {
  const values: unknown[] = [params.churchId];
  const conditions = ["s.church_id = $1"];

  if (params.memberId) {
    values.push(params.memberId);
    conditions.push(`s.member_id = $${values.length}`);
  }

  if (params.sacramentTypeId) {
    values.push(params.sacramentTypeId);
    conditions.push(`s.sacrament_type_id = $${values.length}`);
  }

  values.push(params.limit);
  const limitParam = values.length;

  values.push(params.offset);
  const offsetParam = values.length;

  const result = await db.query<SacramentListItem>(
    `
      SELECT
        s.id,
        s.church_id,
        s.member_id,
        m.member_code,
        m.first_name AS member_first_name,
        m.last_name AS member_last_name,
        s.certificate_number,
        s.sacrament_type_id,
        st.name AS sacrament_type_name,
        s.sacrament_date,
        s.place,
        s.officiant,
        s.notes,
        s.created_by,
        s.created_at,
        s.updated_at
      FROM sacraments s
      INNER JOIN members m ON m.id = s.member_id
      INNER JOIN sacrament_types st ON st.id = s.sacrament_type_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY s.sacrament_date DESC, s.created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    values
  );

  return result.rows;
}
