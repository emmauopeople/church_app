import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { listMembersByChurch } from "../repositories/member.repository.js";

const listMembersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DECEASED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export async function memberRoutes(app: FastifyInstance) {
  app.get("/core/members", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const parsed = listMembersQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid member query parameters",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { search, status, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const members = await listMembersByChurch({
      churchId: authUser.churchId,
      search,
      status,
      limit,
      offset
    });

    return reply.send({
      data: members.map((member) => ({
        id: member.id,
        churchId: member.church_id,
        memberCode: member.member_code,
        firstName: member.first_name,
        lastName: member.last_name,
        middleName: member.middle_name,
        dateOfBirth: member.date_of_birth,
        gender: member.gender,
        phone: member.phone,
        email: member.email,
        city: member.city,
        country: member.country,
        status: member.status,
        createdAt: member.created_at
      })),
      pagination: {
        page,
        limit,
        count: members.length
      }
    });
  });
}
