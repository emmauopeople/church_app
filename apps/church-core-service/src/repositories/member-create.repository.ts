import { db } from "../config/db.js";

export type CreatedMember = {
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
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export async function createMember(params: {
  churchId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  gender?: "MALE" | "FEMALE" | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  maritalStatus?: "SINGLE" | "MARRIED" | "WIDOWED" | "DIVORCED" | null;
  createdBy: string;
}): Promise<CreatedMember> {
  const result = await db.query<CreatedMember>(
    `
      INSERT INTO members (
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
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, lower($10), $11, $12, $13, $14, $15, $16, 'ACTIVE', $17)
      RETURNING
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
        created_by,
        created_at,
        updated_at
    `,
    [
      params.churchId,
      params.memberCode,
      params.firstName,
      params.lastName,
      params.middleName ?? null,
      params.dateOfBirth ?? null,
      params.birthPlace ?? null,
      params.gender ?? null,
      params.phone ?? null,
      params.email ?? null,
      params.address ?? null,
      params.city ?? null,
      params.country ?? null,
      params.fatherName ?? null,
      params.motherName ?? null,
      params.maritalStatus ?? null,
      params.createdBy
    ]
  );

  return result.rows[0];
}
