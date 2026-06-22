import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { createGeneratedDocument } from "../repositories/generated-document.repository.js";
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

export async function certificateRoutes(app: FastifyInstance) {
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

      await createGeneratedDocument({
        churchId: authUser.churchId,
        sacramentId: certificate.certificateData.sacrament.certificateNumber,
        generatedBy: authUser.userId,
        fileName: certificate.fileName
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

      await createGeneratedDocument({
        churchId: authUser.churchId,
        sacramentId: certificate.certificateData.sacrament.certificateNumber,
        generatedBy: authUser.userId,
        fileName: certificate.fileName
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
