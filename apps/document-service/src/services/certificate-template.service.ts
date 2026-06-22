import Handlebars from "handlebars";

import type { CertificateTemplateData } from "./certificate-data.service.js";

export type CertificatePageSize = "A4" | "LETTER" | "A5" | "HALF_LETTER" | "CUSTOM";
export type CertificateOrientation = "portrait" | "landscape";

export type CertificateRenderOptions = {
  size: CertificatePageSize;
  orientation: CertificateOrientation;
  width?: string;
  height?: string;
};

const defaultRenderOptions: CertificateRenderOptions = {
  size: "A4",
  orientation: "landscape"
};

function normalizeDate(value: string) {
  const dateOnly = value.split("T")[0];
  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getCssPageSize(options: CertificateRenderOptions) {
  if (options.size === "CUSTOM" && options.width && options.height) {
    return `${options.width} ${options.height}`;
  }

  if (options.size === "HALF_LETTER") {
    return options.orientation === "landscape" ? "8.5in 5.5in" : "5.5in 8.5in";
  }

  if (options.size === "LETTER") {
    return `Letter ${options.orientation}`;
  }

  return `${options.size} ${options.orientation}`;
}

function getSacramentStatement(typeName: string) {
  const normalized = typeName.toLowerCase();

  if (normalized.includes("mari")) {
    return "ont recu le sacrement du mariage selon le rite de l Eglise catholique";
  }

  if (normalized.includes("confirm")) {
    return "a recu le sacrement de la confirmation selon le rite de l Eglise catholique";
  }

  if (normalized.includes("commun")) {
    return "a recu le sacrement de la premiere communion selon le rite de l Eglise catholique";
  }

  return "a recu le sacrement du bapteme selon le rite de l Eglise catholique";
}

Handlebars.registerHelper("formatDate", (value: string) => normalizeDate(value));
Handlebars.registerHelper("sacramentStatement", (typeName: string) => getSacramentStatement(typeName));

const certificateTemplate = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: {{pageSize}};
      margin: 10mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #1f2933;
      background: #ffffff;
      font-family: Georgia, "Times New Roman", serif;
    }

    .certificate-page {
      min-height: 100vh;
      padding: 10mm;
      background:
        radial-gradient(circle at top left, rgba(212, 175, 55, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(15, 61, 46, 0.12), transparent 30%),
        #fffdf8;
    }

    .certificate-shell {
      position: relative;
      min-height: calc(100vh - 20mm);
      border: 3px solid #0f3d2e;
      padding: 9mm;
      background: #fffdf8;
      overflow: hidden;
    }

    .certificate-shell::before {
      content: "";
      position: absolute;
      inset: 4mm;
      border: 1.5px solid #d4af37;
      pointer-events: none;
    }

    .certificate-shell::after {
      content: "IHS";
      position: absolute;
      left: 50%;
      top: 52%;
      transform: translate(-50%, -50%);
      font-size: 120px;
      font-weight: 700;
      color: rgba(15, 61, 46, 0.055);
      letter-spacing: 12px;
      pointer-events: none;
    }

    .content {
      position: relative;
      z-index: 2;
      min-height: calc(100vh - 38mm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header {
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .diocese {
      color: #9d7a1e;
      font-size: 13px;
      font-weight: 700;
    }

    .church-name {
      margin-top: 4px;
      color: #0f3d2e;
      font-size: 25px;
      font-weight: 700;
    }

    .church-address {
      margin-top: 4px;
      color: #667085;
      font-size: 11px;
      font-family: Arial, sans-serif;
      text-transform: none;
      letter-spacing: 0;
    }

    .title-block {
      margin-top: 8mm;
      text-align: center;
    }

    .document-title {
      margin: 0;
      color: #0f3d2e;
      font-size: 34px;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .document-subtitle {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 22px;
      border-top: 1px solid #d4af37;
      border-bottom: 1px solid #d4af37;
      color: #9d7a1e;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .body-text {
      max-width: 820px;
      margin: 9mm auto 0;
      text-align: center;
      font-size: 17px;
      line-height: 1.75;
    }

    .member-name {
      display: inline-block;
      margin: 5mm 0 4mm;
      padding: 0 16mm 2mm;
      border-bottom: 2px solid #d4af37;
      color: #0f3d2e;
      font-size: 30px;
      font-weight: 700;
      line-height: 1.1;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px 18px;
      max-width: 820px;
      margin: 7mm auto 0;
      text-align: left;
      font-size: 13px;
      font-family: Arial, sans-serif;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 135px minmax(0, 1fr);
      gap: 8px;
      border-bottom: 1px dotted #d8c8a2;
      padding-bottom: 4px;
    }

    .label {
      color: #9d7a1e;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.4px;
    }

    .value {
      color: #1f2933;
      font-weight: 700;
    }

    .signature-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15mm;
      margin-top: 12mm;
      padding: 0 12mm;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 11px;
    }

    .signature-line {
      border-top: 1px solid #1f2933;
      padding-top: 6px;
      font-weight: 700;
      color: #0f3d2e;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 7mm;
      color: #667085;
      font-family: Arial, sans-serif;
      font-size: 10px;
    }

    .certificate-number {
      color: #0f3d2e;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="certificate-page">
    <section class="certificate-shell">
      <div class="content">
        <div>
          <header class="header">
            <div class="diocese">{{church.diocese}}</div>
            <div class="church-name">{{church.name}}</div>
            <div class="church-address">{{church.address}} {{#if church.phone}} | Tel: {{church.phone}}{{/if}} {{#if church.email}} | {{church.email}}{{/if}}</div>
          </header>

          <section class="title-block">
            <h1 class="document-title">Certificat de {{sacrament.typeName}}</h1>
            <div class="document-subtitle">Acte sacramentel officiel</div>
          </section>

          <section class="body-text">
            <div>Nous certifions par la presente que</div>
            <div class="member-name">{{member.fullName}}</div>
            <div>{{sacramentStatement sacrament.typeName}}.</div>
          </section>

          <section class="details-grid">
            <div class="detail-row"><span class="label">Code paroissien</span><span class="value">{{member.memberCode}}</span></div>
            <div class="detail-row"><span class="label">Certificat</span><span class="value">{{sacrament.certificateNumber}}</span></div>
            <div class="detail-row"><span class="label">Date de naissance</span><span class="value">{{formatDate member.dateOfBirth}}</span></div>
            <div class="detail-row"><span class="label">Lieu de naissance</span><span class="value">{{member.birthPlace}}</span></div>
            <div class="detail-row"><span class="label">Pere</span><span class="value">{{member.fatherName}}</span></div>
            <div class="detail-row"><span class="label">Mere</span><span class="value">{{member.motherName}}</span></div>
            <div class="detail-row"><span class="label">Date du sacrement</span><span class="value">{{formatDate sacrament.date}}</span></div>
            <div class="detail-row"><span class="label">Lieu</span><span class="value">{{sacrament.place}}</span></div>
            <div class="detail-row"><span class="label">Officiant</span><span class="value">{{sacrament.officiant}}</span></div>
            <div class="detail-row"><span class="label">Parrain</span><span class="value">{{sacrament.parrain}}</span></div>
            <div class="detail-row"><span class="label">Marraine</span><span class="value">{{sacrament.marraine}}</span></div>
            <div class="detail-row"><span class="label">Notes</span><span class="value">{{sacrament.notes}}</span></div>
          </section>
        </div>

        <div>
          <section class="signature-row">
            <div class="signature-line">Officiant</div>
            <div class="signature-line">Cachet de la paroisse</div>
            <div class="signature-line">Secretaire paroissial</div>
          </section>

          <footer class="footer">
            <span>Genere le {{formatDate document.generatedAt}}</span>
            <span class="certificate-number">No {{sacrament.certificateNumber}}</span>
          </footer>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`;

export function normalizeCertificateRenderOptions(options?: Partial<CertificateRenderOptions>): CertificateRenderOptions {
  return {
    ...defaultRenderOptions,
    ...options
  };
}

export function renderSacramentCertificateHtml(data: CertificateTemplateData, options?: Partial<CertificateRenderOptions>) {
  const renderOptions = normalizeCertificateRenderOptions(options);
  const template = Handlebars.compile(certificateTemplate);

  return template({
    ...data,
    pageSize: getCssPageSize(renderOptions)
  });
}

export function buildCertificateFileName(data: CertificateTemplateData) {
  const safeType = data.sacrament.typeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `certificat-${safeType || "sacrement"}-${data.sacrament.certificateNumber}.pdf`;
}
