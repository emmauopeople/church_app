export type Gender = 'male' | 'female';

export type MaritalStatus = 'single' | 'married' | 'widowed' | 'divorced';

export type Member = {
  id: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  gender: Gender;
  phone: string;
  address: string;
  fatherName: string;
  motherName: string;
  maritalStatus: MaritalStatus;
  registrationDate: string;
  notes?: string;
};

export type MemberFormValues = Omit<Member, 'id' | 'registrationDate'>;
