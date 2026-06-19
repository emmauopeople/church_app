import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { createSacrament } from "../repositories/sacrament-create.repository.js";
import { listSacramentsByChurch } from "../repositories/sacrament-list.repository.js";

const createSacramentSchema = z.object({
  memberId: z.string().uuid(),
  certificateNumber: z.string().min(2),
  sacramentTypeId: z.coerce.number().int().positive(),
  sacramentDate: z.string().min(10),
  place: z.string().optional().nullable(),
  officiant: z.string().optional().nullable(),
  sponsor1Name: z.string().min(1),
  sponsor2Name: z.string().min(1),
  notes: z.string().optional().nullable()
});

const listSacramentsQuerySchema = z.object({
  sacramentTypeId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

const memberSacramentParamsSchema = z.object({
  id: z.string().uuid()
});

function formatSacrament(sacrament: any) {
  return {
    id: sacrament.id,
    churchId: sacrament.church_id,
    memberId: sacrament.member_id,
    memberCode: sacrament.member_code,
    memberFirstName: sacrament.member_first_name,
    memberLastName: sacrament.member_last_name,
    certificateNumber: sacrament.certificate_number,
    sacramentTypeId: sacrament.sacrament_type_id,
    sacramentTypeName: sacrament.sacrament_type_name,
    sacramentDate: sacrament.sacrament_date,
    place: sacrament.place,
    officiant: sacrament.officiant,
    sponsor1Name: sacrament.sponsor1_name,
    sponsor2Name: sacrament.sponsor2_name,
    notes: sacrament.notes,
    createdBy: sacrament.created_by,
    createdAt: sacrament.created_at,
    updatedAt: sacrament.updated_at
  };
}

export async function sacramentRoutes(app: FastifyInstance) {
  app.get("/core/sacraments", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const parsed = listSacramentsQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid sacrament query parameters",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { sacramentTypeId, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const sacraments = await listSacramentsByChurch({
      churchId: authUser.churchId,
      sacramentTypeId,
      limit,
      offset
    });

    return reply.send({
      data: sacraments.map(formatSacrament),
      pagination: {
        page,
        limit,
        count: sacraments.length
      }
    });
  });

  app.get("/core/members/:id/sacraments", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const paramsParsed = memberSacramentParamsSchema.safeParse(request.params);

    if (!paramsParsed.success) {
      return reply.status(400).send({
        message: "Invalid member id",
        errors: paramsParsed.error.flatten().fieldErrors
      });
    }

    const queryParsed = listSacramentsQuerySchema.safeParse(request.query);

    if (!queryParsed.success) {
      return reply.status(400).send({
        message: "Invalid sacrament query parameters",
        errors: queryParsed.error.flatten().fieldErrors
      });
    }

    const { sacramentTypeId, page, limit } = queryParsed.data;
    const offset = (page - 1) * limit;

    const sacraments = await listSacramentsByChurch({
      churchId: authUser.churchId,
      memberId: paramsParsed.data.id,
      sacramentTypeId,
      limit,
      offset
    });

    return reply.send({
      data: sacraments.map(formatSacrament),
      pagination: {
        page,
        limit,
        count: sacraments.length
      }
    });
  });

  app.post("/core/sacraments", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const parsed = createSacramentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid sacrament creation request",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    try {
      const sacrament = await createSacrament({
        churchId: authUser.churchId,
        createdBy: authUser.userId,
        ...parsed.data
      });

      if (!sacrament) {
        return reply.status(404).send({
          message: "Member not found"
        });
      }

      return reply.status(201).send({
        message: "Sacrament record created successfully",
        data: formatSacrament(sacrament)
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        return reply.status(409).send({
          message: "A sacrament record with this certificate number already exists"
        });
      }

      if (error?.code === "23503") {
        return reply.status(400).send({
          message: "Invalid sacrament type"
        });
      }

      throw error;
    }
  });
}
