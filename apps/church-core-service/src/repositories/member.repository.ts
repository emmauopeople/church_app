import { db } from "../config/db.js";

export type MemberListItem = {
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
  city: string | null;
  country: string | null;
  status: "ACTIVE" | "INACTIVE" | "DECEASED";
  created_at: Date;
};

export async function listMembersByChurch(params: {
  churchId: string;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "DECEASED";
  limit: number;
  offset: number;
}): Promise<MemberListItem[]> {
  const values: unknown[] = [params.churchId];
  const conditions = ["church_id = $1"];

  if (params.search) {
    values.push(`%${params.search}%`);
    conditions.push(`(
      first_name ILIKE $${values.length}
      OR last_name ILIKE $${values.length}
      OR member_code ILIKE $${values.length}
      OR phone ILIKE $${values.length}
    )`);
  }

  if (params.status) {
    values.push(params.status);
    conditions.push(`status = $${values.length}`);
  }

  values.push(params.limit);
  const limitParam = values.length;

  values.push(params.offset);
  const offsetParam = values.length;

  const result = await db.query<MemberListItem>(
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
        city,
        country,
        status,
        created_at
      FROM members
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    values
  );

  return result.rows;
}
