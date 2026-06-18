import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { createSacrament } from "../repositories/sacrament-create.repository.js";

const createSacramentSchema = z.object({
  memberId: z.string().uuid(),
  certificateNumber: z.string().min(2),
  sacramentTypeId: z.coerce.number().int().positive(),
  sacramentDate: z.string().min(10),
  place: z.string().optional().nullable(),
  officiant: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

function formatSacrament(sacrament: {
  id: string;
  church_id: string;
  member_id: string;
  certificate_number: string;
  sacrament_type_id: number;
  sacrament_type_name: string;
  sacrament_date: string;
  place: string | null;
  officiant: string | null;
  notes: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: sacrament.id,
    churchId: sacrament.church_id,
    memberId: sacrament.member_id,
    certificateNumber: sacrament.certificate_number,
    sacramentTypeId: sacrament.sacrament_type_id,
    sacramentTypeName: sacrament.sacrament_type_name,
    sacramentDate: sacrament.sacrament_date,
    place: sacrament.place,
    officiant: sacrament.officiant,
    notes: sacrament.notes,
    createdBy: sacrament.created_by,
    createdAt: sacrament.created_at,
    updatedAt: sacrament.updated_at
  };
}

export async function sacramentRoutes(app: FastifyInstance) {
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
