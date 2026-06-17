import { db } from "../config/db.js";

export type MemberDetail = {
  id: string;
  church_id: string;
  member_code: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  gender: "MALE" | "FEMALE" | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: "ACTIVE" | "INACTIVE" | "DECEASED";
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export async function findMemberByIdForChurch(params: {
  memberId: string;
  churchId: string;
}): Promise<MemberDetail | null> {
  const result = await db.query<MemberDetail>(
    `
      SELECT
        id,
        church_id,
        member_code,
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        city,
        country,
        status,
        created_by,
        created_at,
        updated_at
      FROM members
      WHERE id = $1
        AND church_id = $2
      LIMIT 1
    `,
    [params.memberId, params.churchId]
  );

  return result.rows[0] ?? null;
}
