import { db } from "../config/db.js";

export type MemberListItem = {
  id: string;
  church_id: string;
  member_code: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  birth_place: string | null;
  gender: "MALE" | "FEMALE" | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  father_name: string | null;
  mother_name: string | null;
  marital_status: "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED" | null;
  status: "ACTIVE" | "INACTIVE" | "DECEASED";
  created_at: Date;
};

type CountResult = {
  total: string;
};

type NextCodeResult = {
  next_number: string;
};

export async function listMembersByChurch(params: {
  churchId: string;
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "DECEASED";
  limit: number;
  offset: number;
}): Promise<{ members: MemberListItem[]; total: number }> {
  const values: unknown[] = [params.churchId];
  const conditions = ["church_id = $1"];

  if (params.search) {
    values.push(`%${params.search}%`);
    conditions.push(`(
      first_name ILIKE $${values.length}
      OR last_name ILIKE $${values.length}
      OR member_code ILIKE $${values.length}
      OR phone ILIKE $${values.length}
      OR email ILIKE $${values.length}
      OR city ILIKE $${values.length}
    )`);
  }

  if (params.status) {
    values.push(params.status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await db.query<CountResult>(
    `
      SELECT COUNT(*)::text AS total
      FROM members
      WHERE ${whereClause}
    `,
    values
  );

  const queryValues = [...values, params.limit, params.offset];
  const limitParam = queryValues.length - 1;
  const offsetParam = queryValues.length;

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
        birth_place,
        gender,
        phone,
        email,
        address,
        city,
        country,
        father_name,
        mother_name,
        marital_status,
        status,
        created_at
      FROM members
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    queryValues
  );

  return {
    members: result.rows,
    total: Number(countResult.rows[0]?.total ?? 0)
  };
}

export async function getNextMemberCodeByChurch(churchId: string): Promise<string> {
  const result = await db.query<NextCodeResult>(
    `
      SELECT COALESCE(MAX((regexp_match(member_code, '[0-9]+'))[1]::int), 0) + 1 AS next_number
      FROM members
      WHERE church_id = $1
    `,
    [churchId]
  );

  const nextNumber = Number(result.rows[0]?.next_number ?? 1);
  return `MBR-${String(nextNumber).padStart(4, "0")}`;
}
