import { db } from "../config/db.js";

export type SacramentDetail = {
  id: string;
  church_id: string;
  member_id: string;
  member_code: string;
  member_first_name: string;
  member_last_name: string;
  member_middle_name: string | null;
  member_date_of_birth: string | null;
  member_birth_place: string | null;
  member_father_name: string | null;
  member_mother_name: string | null;
  certificate_number: string;
  sacrament_type_id: number;
  sacrament_type_code: string;
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

export async function findSacramentDetailForChurch(params: {
  sacramentId: string;
  churchId: string;
}): Promise<SacramentDetail | null> {
  const result = await db.query<SacramentDetail>(
    `
      SELECT
        s.id,
        s.church_id,
        s.member_id,
        m.member_code,
        m.first_name AS member_first_name,
        m.last_name AS member_last_name,
        m.middle_name AS member_middle_name,
        m.date_of_birth AS member_date_of_birth,
        m.birth_place AS member_birth_place,
        m.father_name AS member_father_name,
        m.mother_name AS member_mother_name,
        s.certificate_number,
        s.sacrament_type_id,
        st.code AS sacrament_type_code,
        st.name AS sacrament_type_name,
        s.sacrament_date,
        s.place,
        s.officiant,
        s.sponsor1_name,
        s.sponsor2_name,
        s.notes,
        s.created_by,
        s.created_at,
        s.updated_at
      FROM sacraments s
      INNER JOIN members m ON m.id = s.member_id
      INNER JOIN sacrament_types st ON st.id = s.sacrament_type_id
      WHERE s.id = $1
        AND s.church_id = $2
      LIMIT 1
    `,
    [params.sacramentId, params.churchId]
  );

  return result.rows[0] ?? null;
}
