export type CoreSacramentDetail = {
  id: string;
  churchId: string;
  memberId: string;
  memberCode: string;
  memberFirstName: string;
  memberLastName: string;
  memberMiddleName?: string | null;
  memberDateOfBirth?: string | null;
  memberBirthPlace?: string | null;
  memberFatherName?: string | null;
  memberMotherName?: string | null;
  certificateNumber: string;
  sacramentTypeId: number;
  sacramentTypeCode: string;
  sacramentTypeName: string;
  sacramentDate: string;
  place?: string | null;
  officiant?: string | null;
  sponsor1Name?: string | null;
  sponsor2Name?: string | null;
  notes?: string | null;
};

export type CertificateTemplateData = {
  church: {
    name: string;
    diocese: string;
    address: string;
    phone: string;
    email: string;
  };
  member: {
    fullName: string;
    memberCode: string;
    dateOfBirth: string;
    birthPlace: string;
    fatherName: string;
    motherName: string;
  };
  sacrament: {
    typeCode: string;
    typeName: string;
    certificateNumber: string;
    date: string;
    place: string;
    officiant: string;
    parrain: string;
    marraine: string;
    notes: string;
  };
  document: {
    generatedAt: string;
    generatedBy: string;
  };
};

type CoreSacramentResponse = {
  data: CoreSacramentDetail;
};

const churchCoreServiceUrl = process.env.CHURCH_CORE_SERVICE_URL ?? "http://localhost:4002";

function withFallback(value: string | null | undefined, fallback = "-") {
  const cleanValue = String(value ?? "").trim();
  return cleanValue || fallback;
}

function buildFullName(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export async function fetchSacramentCertificateData(params: {
  sacramentId: string;
  authorizationHeader: string;
  generatedBy: string;
}): Promise<CertificateTemplateData> {
  const response = await fetch(`${churchCoreServiceUrl}/core/sacraments/${params.sacramentId}`, {
    headers: {
      Authorization: params.authorizationHeader
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? "Unable to load sacrament data");
  }

  const result = await response.json() as CoreSacramentResponse;
  const sacrament = result.data;

  return {
    church: {
      name: process.env.PARISH_NAME ?? "Paroisse Catholique",
      diocese: process.env.DIOCESE_NAME ?? "Diocese",
      address: process.env.PARISH_ADDRESS ?? "Adresse de la paroisse",
      phone: process.env.PARISH_PHONE ?? "",
      email: process.env.PARISH_EMAIL ?? ""
    },
    member: {
      fullName: buildFullName([
        sacrament.memberFirstName,
        sacrament.memberMiddleName,
        sacrament.memberLastName
      ]),
      memberCode: withFallback(sacrament.memberCode),
      dateOfBirth: withFallback(sacrament.memberDateOfBirth),
      birthPlace: withFallback(sacrament.memberBirthPlace),
      fatherName: withFallback(sacrament.memberFatherName),
      motherName: withFallback(sacrament.memberMotherName)
    },
    sacrament: {
      typeCode: sacrament.sacramentTypeCode,
      typeName: sacrament.sacramentTypeName,
      certificateNumber: sacrament.certificateNumber,
      date: sacrament.sacramentDate,
      place: withFallback(sacrament.place, process.env.PARISH_NAME ?? "Paroisse"),
      officiant: withFallback(sacrament.officiant),
      parrain: withFallback(sacrament.sponsor1Name),
      marraine: withFallback(sacrament.sponsor2Name),
      notes: withFallback(sacrament.notes)
    },
    document: {
      generatedAt: new Date().toISOString(),
      generatedBy: params.generatedBy
    }
  };
}
