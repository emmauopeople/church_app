import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import {
  createGeneratedDocument,
  listGeneratedCertificateLogs,
  type CertificateDocumentAction
} from "../repositories/generated-document.repository.js";
import { fetchSacramentCertificateData } from "../services/certificate-data.service.js";
import {
  buildCertificateFileName,
  normalizeCertificateRenderOptions,
  renderSacramentCertificateHtml,
  type CertificateOrientation,
  type CertificatePageSize
} from "../services/certificate-template.service.js";
import { renderPdfFromHtml } from "../services/pdf-renderer.service.js";

const certificateParamsSchema = z.object({
  sacramentId: z.string().uuid()
});

const certificateQuerySchema = z.object({
  size: z.enum(["A4", "LETTER", "A5", "HALF_LETTER", "CUSTOM"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("landscape"),
  width: z.string().optional(),
  height: z.string().optional()
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100)
});

type CertificateRequest = FastifyRequest<{
  Params: {
    sacramentId: string;
  };
  Querystring: {
    size?: CertificatePageSize;
    orientation?: CertificateOrientation;
    width?: string;
    height?: string;
  };
}>;

type CertificateAuditRequest = FastifyRequest<{
  Querystring: {
    limit?: string;
  };
}>;

function getAuthorizationHeader(request: FastifyRequest) {
  return request.headers.authorization ?? "";
}

function parseCertificateRequest(request: CertificateRequest, reply: FastifyReply) {
  const paramsParsed = certificateParamsSchema.safeParse(request.params);

  if (!paramsParsed.success) {
    reply.status(400).send({
      message: "Invalid sacrament id",
      errors: paramsParsed.error.flatten().fieldErrors
    });
    return null;
  }

  const queryParsed = certificateQuerySchema.safeParse(request.query);

  if (!queryParsed.success) {
    reply.status(400).send({
      message: "Invalid certificate options",
      errors: queryParsed.error.flatten().fieldErrors
    });
    return null;
  }

  if (queryParsed.data.size === "CUSTOM" && (!queryParsed.data.width || !queryParsed.data.height)) {
    reply.status(400).send({
      message: "Custom certificate size requires width and height"
    });
    return null;
  }

  return {
    sacramentId: paramsParsed.data.sacramentId,
    renderOptions: normalizeCertificateRenderOptions(queryParsed.data)
  };
}

async function buildCertificate(params: {
  request: CertificateRequest;
  reply: FastifyReply;
  generatedBy: string;
}) {
  const parsed = parseCertificateRequest(params.request, params.reply);

  if (!parsed) {
    return null;
  }

  const certificateData = await fetchSacramentCertificateData({
    sacramentId: parsed.sacramentId,
    authorizationHeader: getAuthorizationHeader(params.request),
    generatedBy: params.generatedBy
  });

  const html = renderSacramentCertificateHtml(certificateData, parsed.renderOptions);
  const fileName = buildCertificateFileName(certificateData);

  return {
    html,
    fileName,
    certificateData,
    renderOptions: parsed.renderOptions
  };
}

async function trackGeneratedCertificate(params: {
  request: CertificateRequest;
  churchId: string;
  sacramentId: string;
  generatedBy: string;
  fileName: string;
  action: CertificateDocumentAction;
}) {
  try {
    await createGeneratedDocument({
      churchId: params.churchId,
      sacramentId: params.sacramentId,
      generatedBy: params.generatedBy,
      fileName: params.fileName,
      action: params.action
    });
  } catch (error) {
    params.request.log.warn(error, "Certificate was generated, but tracking record was not saved");
  }
}

function formatCertificateAuditLog(log: Awaited<ReturnType<typeof listGeneratedCertificateLogs>>[number]) {
  return {
    id: log.id,
    churchId: log.church_id,
    action: log.action,
    documentType: log.document_type,
    referenceEntityType: log.reference_entity_type,
    referenceEntityId: log.reference_entity_id,
    generatedBy: log.generated_by,
    fileName: log.file_name,
    createdAt: log.created_at
  };
}

export async function certificateRoutes(app: FastifyInstance) {
  app.get("/documents/certificates/audit-logs", async (request: CertificateAuditRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    if (authUser.role !== "ADMIN") {
      return reply.status(403).send({
        message: "Admin access required"
      });
    }

    const parsed = auditQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid audit query",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const logs = await listGeneratedCertificateLogs({
      churchId: authUser.churchId,
      limit: parsed.data.limit
    });

    return reply.send({
      data: logs.map(formatCertificateAuditLog)
    });
  });

  app.get("/documents/certificates/sacraments/:sacramentId/html-preview", async (request: CertificateRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    try {
      const certificate = await buildCertificate({
        request,
        reply,
        generatedBy: authUser.userId
      });

      if (!certificate) {
        return;
      }

      await trackGeneratedCertificate({
        request,
        churchId: authUser.churchId,
        sacramentId: certificate.certificateData.sacrament.id,
        generatedBy: authUser.userId,
        fileName: certificate.fileName,
        action: "HTML_PREVIEW"
      });

      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .send(certificate.html);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({
        message: error instanceof Error ? error.message : "Unable to generate certificate HTML preview"
      });
    }
  });

  app.get("/documents/certificates/sacraments/:sacramentId/preview", async (request: CertificateRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    try {
      const certificate = await buildCertificate({
        request,
        reply,
        generatedBy: authUser.userId
      });

      if (!certificate) {
        return;
      }

      const pdf = await renderPdfFromHtml(certificate.html, certificate.renderOptions);

      await trackGeneratedCertificate({
        request,
        churchId: authUser.churchId,
        sacramentId: certificate.certificateData.sacrament.id,
        generatedBy: authUser.userId,
        fileName: certificate.fileName,
        action: "PDF_PREVIEW"
      });

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `inline; filename="${certificate.fileName}"`)
        .send(pdf);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({
        message: error instanceof Error ? error.message : "Unable to generate certificate PDF preview"
      });
    }
  });

  app.get("/documents/certificates/sacraments/:sacramentId/download", async (request: CertificateRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    try {
      const certificate = await buildCertificate({
        request,
        reply,
        generatedBy: authUser.userId
      });

      if (!certificate) {
        return;
      }

      const pdf = await renderPdfFromHtml(certificate.html, certificate.renderOptions);

      await trackGeneratedCertificate({
        request,
        churchId: authUser.churchId,
        sacramentId: certificate.certificateData.sacrament.id,
        generatedBy: authUser.userId,
        fileName: certificate.fileName,
        action: "PDF_DOWNLOAD"
      });

      return reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `attachment; filename="${certificate.fileName}"`)
        .send(pdf);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({
        message: error instanceof Error ? error.message : "Unable to download certificate PDF"
      });
    }
  });
}
