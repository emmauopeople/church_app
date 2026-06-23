export type Gender = 'MALE' | 'FEMALE';

export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED';

export type Member = {
  id: string;
  churchId?: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth?: string | null;
  birthPlace?: string | null;
  gender?: Gender | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  maritalStatus?: MaritalStatus | null;
  status: MemberStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MemberFormValues = Omit<Member, 'id' | 'churchId' | 'createdBy' | 'createdAt' | 'updatedAt'>;
