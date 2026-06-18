import { db } from "../config/db.js";

export type UpdatedMember = {
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

export async function updateMemberForChurch(params: {
  memberId: string;
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
  status: "ACTIVE" | "INACTIVE" | "DECEASED";
}): Promise<UpdatedMember | null> {
  const result = await db.query<UpdatedMember>(
    `
      UPDATE members
      SET
        member_code = $3,
        first_name = $4,
        last_name = $5,
        middle_name = $6,
        date_of_birth = $7,
        birth_place = $8,
        gender = $9,
        phone = $10,
        email = lower($11),
        address = $12,
        city = $13,
        country = $14,
        father_name = $15,
        mother_name = $16,
        marital_status = $17,
        status = $18,
        updated_at = NOW()
      WHERE id = $1
        AND church_id = $2
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
      params.memberId,
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
      params.status
    ]
  );

  return result.rows[0] ?? null;
}
