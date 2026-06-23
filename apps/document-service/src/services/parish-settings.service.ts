export type ParishDocumentSettings = {
  name: string;
  diocese: string;
  address: string;
  phone: string;
  email: string;
  logoDataUri: string;
  sealDataUri: string;
};

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildTemporaryLogoSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="120" fill="#0F3D2E"/>
      <circle cx="120" cy="120" r="104" fill="none" stroke="#D4AF37" stroke-width="8"/>
      <circle cx="120" cy="120" r="88" fill="#FFF9EE"/>
      <path d="M120 48v116" stroke="#0F3D2E" stroke-width="14" stroke-linecap="round"/>
      <path d="M82 84h76" stroke="#0F3D2E" stroke-width="14" stroke-linecap="round"/>
      <path d="M94 166c14 16 38 16 52 0" fill="none" stroke="#D4AF37" stroke-width="9" stroke-linecap="round"/>
      <text x="120" y="212" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#0F3D2E">PAROISSE</text>
    </svg>
  `;
}

function buildTemporarySealSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <circle cx="120" cy="120" r="110" fill="#FFF9EE" stroke="#0F3D2E" stroke-width="8"/>
      <circle cx="120" cy="120" r="91" fill="none" stroke="#D4AF37" stroke-width="5"/>
      <text x="120" y="73" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F3D2E">CACHET</text>
      <text x="120" y="126" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="#0F3D2E">IHS</text>
      <text x="120" y="169" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#9D7A1E">PAROISSIAL</text>
      <path d="M82 194h76" stroke="#D4AF37" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;
}

export async function getParishDocumentSettings(_churchId: string): Promise<ParishDocumentSettings> {
  return {
    name: process.env.PARISH_NAME ?? "Paroisse Saint Joseph",
    diocese: process.env.DIOCESE_NAME ?? "Diocese de Bamenda",
    address: process.env.PARISH_ADDRESS ?? "Bureau paroissial - Adresse temporaire",
    phone: process.env.PARISH_PHONE ?? "+237 000 000 000",
    email: process.env.PARISH_EMAIL ?? "secretariat@paroisse.local",
    logoDataUri: svgToDataUri(buildTemporaryLogoSvg()),
    sealDataUri: svgToDataUri(buildTemporarySealSvg())
  };
}
