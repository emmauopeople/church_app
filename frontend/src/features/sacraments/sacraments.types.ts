export type SacramentType = {
  id: number;
  code: string;
  name: string;
};

export type Sacrament = {
  id: string;
  churchId: string;
  memberId: string;
  memberCode: string;
  memberFirstName: string;
  memberLastName: string;
  certificateNumber: string;
  sacramentTypeId: number;
  sacramentTypeName: string;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  notes?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSacramentPayload = {
  memberId: string;
  certificateNumber: string;
  sacramentTypeId: number;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  notes?: string | null;
};
