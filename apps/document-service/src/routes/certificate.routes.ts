import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { createGeneratedDocument } from "../repositories/generated-document.repository.js";

const sacramentCertificateSchema = z.object({
  sacramentId: z.string().uuid(),
  certificateNumber: z.string().min(2),
  sacramentTypeName: z.string().min(2),
  sacramentDate: z.string().min(10),
  place: z.string().optional().nullable(),
  officiant: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  memberCode: z.string().optional().nullable(),
  memberFirstName: z.string().min(1),
  memberLastName: z.string().min(1)
});

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string): string {
  const dateOnly = value.split("T")[0];
  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function buildSacramentCertificateHtml(data: z.infer<typeof sacramentCertificateSchema>): string {
  const fullName = `${data.memberFirstName} ${data.memberLastName}`;
  const title = `${data.sacramentTypeName} Certificate`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: Georgia, "Times New Roman", serif;
      background: #f3f0e8;
      padding: 40px;
      color: #1f2933;
    }

    .certificate {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 10px solid #8b6f3e;
      padding: 48px;
      text-align: center;
    }

    .church-name {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .certificate-title {
      font-size: 36px;
      font-weight: bold;
      margin: 28px 0;
      color: #6b4f1d;
    }

    .statement {
      font-size: 20px;
      line-height: 1.7;
      margin: 24px 0;
    }

    .person-name {
      font-size: 32px;
      font-weight: bold;
      margin: 24px 0;
      border-bottom: 2px solid #8b6f3e;
      display: inline-block;
      padding: 0 40px 8px;
    }

    .details {
      margin-top: 30px;
      font-size: 17px;
      line-height: 1.8;
      text-align: left;
      display: inline-block;
    }

    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 70px;
      gap: 40px;
    }

    .signature-box {
      flex: 1;
      border-top: 1px solid #1f2933;
      padding-top: 10px;
      font-size: 16px;
    }

    .certificate-number {
      margin-top: 40px;
      font-size: 14px;
      color: #4b5563;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }

      .certificate {
        border: 10px solid #8b6f3e;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="church-name">${escapeHtml(data.place || "Church Parish")}</div>

    <div class="certificate-title">${escapeHtml(title)}</div>

    <div class="statement">
      This is to certify that
    </div>

    <div class="person-name">${escapeHtml(fullName)}</div>

    <div class="statement">
      has received the sacrament of <strong>${escapeHtml(data.sacramentTypeName)}</strong>.
    </div>

    <div class="details">
      <div><strong>Date:</strong> ${escapeHtml(formatDate(data.sacramentDate))}</div>
      <div><strong>Place:</strong> ${escapeHtml(data.place)}</div>
      <div><strong>Officiant:</strong> ${escapeHtml(data.officiant)}</div>
      <div><strong>Member Code:</strong> ${escapeHtml(data.memberCode)}</div>
    </div>

    <div class="signature-row">
      <div class="signature-box">Parish Priest / Officiant</div>
      <div class="signature-box">Church Seal / Secretary</div>
    </div>

    <div class="certificate-number">
      Certificate Number: ${escapeHtml(data.certificateNumber)}
    </div>
  </div>
</body>
</html>`;
}

export async function certificateRoutes(app: FastifyInstance) {
  app.post("/documents/sacrament-certificates", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const parsed = sacramentCertificateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid certificate request",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const html = buildSacramentCertificateHtml(parsed.data);

    const fileName = `${parsed.data.certificateNumber}.html`;

    const generatedDocument = await createGeneratedDocument({
      churchId: authUser.churchId,
      sacramentId: parsed.data.sacramentId,
      generatedBy: authUser.userId,
      fileName
    });

    return reply.status(201).send({
      message: "Sacrament certificate generated successfully",
      document: {
        id: generatedDocument.id,
        fileName: generatedDocument.file_name,
        documentType: generatedDocument.document_type,
        referenceEntityType: generatedDocument.reference_entity_type,
        referenceEntityId: generatedDocument.reference_entity_id,
        createdAt: generatedDocument.created_at
      },
      html
    });
  });
}
