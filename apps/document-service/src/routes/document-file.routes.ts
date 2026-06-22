import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import {
  createChurchDocument,
  findChurchDocumentById,
  listChurchDocuments
} from "../repositories/church-document.repository.js";

const listDocumentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

const documentParamsSchema = z.object({
  id: z.string().uuid()
});

function formatDocument(document: {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  category: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: document.id,
    churchId: document.church_id,
    title: document.title,
    description: document.description,
    category: document.category,
    originalFileName: document.original_file_name,
    mimeType: document.mime_type,
    sizeBytes: document.size_bytes,
    uploadedBy: document.uploaded_by,
    createdAt: document.created_at,
    updatedAt: document.updated_at
  };
}

function getMultipartFieldValue(fields: Record<string, unknown>, fieldName: string) {
  const field = fields[fieldName] as { value?: unknown } | undefined;
  return typeof field?.value === "string" ? field.value.trim() : "";
}

function cleanCategory(value: string) {
  const cleanValue = value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 50);
  return cleanValue || "GENERAL";
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[\r\n"]/g, "_");
}

async function findDocumentForRequest(request: FastifyRequest, reply: FastifyReply) {
  const authUser = requireAuth(request, reply);

  if (!authUser) {
    return null;
  }

  const paramsParsed = documentParamsSchema.safeParse(request.params);

  if (!paramsParsed.success) {
    reply.status(400).send({
      message: "Invalid document id",
      errors: paramsParsed.error.flatten().fieldErrors
    });
    return null;
  }

  const document = await findChurchDocumentById({
    churchId: authUser.churchId,
    documentId: paramsParsed.data.id
  });

  if (!document) {
    reply.status(404).send({ message: "Document not found" });
    return null;
  }

  return document;
}

export async function documentFileRoutes(app: FastifyInstance) {
  app.get("/documents/files", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const parsed = listDocumentsQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid document query parameters",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { search, category, page, limit } = parsed.data;
    const { documents, total } = await listChurchDocuments({
      churchId: authUser.churchId,
      search: search || undefined,
      category: category || undefined,
      limit,
      offset: (page - 1) * limit
    });

    return reply.send({
      data: documents.map(formatDocument),
      pagination: {
        page,
        limit,
        count: documents.length,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  });

  app.post("/documents/files", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const uploadedFile = await request.file({
      limits: {
        fileSize: 10 * 1024 * 1024
      }
    });

    if (!uploadedFile) {
      return reply.status(400).send({ message: "Document file is required" });
    }

    const fileBuffer = await uploadedFile.toBuffer();
    const fields = uploadedFile.fields as Record<string, unknown>;
    const title = getMultipartFieldValue(fields, "title") || uploadedFile.filename;
    const description = getMultipartFieldValue(fields, "description") || null;
    const category = cleanCategory(getMultipartFieldValue(fields, "category"));

    const document = await createChurchDocument({
      churchId: authUser.churchId,
      title,
      description,
      category,
      originalFileName: uploadedFile.filename,
      mimeType: uploadedFile.mimetype || "application/octet-stream",
      sizeBytes: fileBuffer.length,
      fileContent: fileBuffer,
      uploadedBy: authUser.userId
    });

    return reply.status(201).send({
      message: "Document uploaded successfully",
      data: formatDocument(document)
    });
  });

  app.get("/documents/files/:id/preview", async (request: FastifyRequest, reply: FastifyReply) => {
    const document = await findDocumentForRequest(request, reply);

    if (!document) {
      return;
    }

    return reply
      .header("Content-Type", document.mime_type)
      .header("Content-Length", String(document.size_bytes))
      .header("Content-Disposition", `inline; filename="${cleanFileName(document.original_file_name)}"`)
      .send(document.file_content);
  });

  app.get("/documents/files/:id/download", async (request: FastifyRequest, reply: FastifyReply) => {
    const document = await findDocumentForRequest(request, reply);

    if (!document) {
      return;
    }

    return reply
      .header("Content-Type", document.mime_type)
      .header("Content-Length", String(document.size_bytes))
      .header("Content-Disposition", `attachment; filename="${cleanFileName(document.original_file_name)}"`)
      .send(document.file_content);
  });
}
