import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import { createMember } from "../repositories/member-create.repository.js";
import { findMemberByIdForChurch } from "../repositories/member-detail.repository.js";
import { listMembersByChurch } from "../repositories/member.repository.js";
import { updateMemberForChurch } from "../repositories/member-update.repository.js";

const listMembersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DECEASED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

const memberParamsSchema = z.object({
  id: z.string().uuid()
});

const createMemberSchema = z.object({
  memberCode: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "DIVORCED"]).optional().nullable()
});

const updateMemberSchema = createMemberSchema.extend({
  status: z.enum(["ACTIVE", "INACTIVE", "DECEASED"]).default("ACTIVE")
});

function formatMember(member: any) {
  return {
    id: member.id,
    churchId: member.church_id,
    memberCode: member.member_code,
    firstName: member.first_name,
    lastName: member.last_name,
    middleName: member.middle_name,
    dateOfBirth: member.date_of_birth,
    birthPlace: member.birth_place,
    gender: member.gender,
    phone: member.phone,
    email: member.email,
    address: member.address,
    city: member.city,
    country: member.country,
    fatherName: member.father_name,
    motherName: member.mother_name,
    maritalStatus: member.marital_status,
    status: member.status,
    createdBy: member.created_by,
    createdAt: member.created_at,
    updatedAt: member.updated_at
  };
}

export async function memberRoutes(app: FastifyInstance) {
  app.get("/core/members", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) return;

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
      data: members.map(formatMember),
      pagination: {
        page,
        limit,
        count: members.length
      }
    });
  });

  app.get("/core/members/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) return;

    const parsed = memberParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid member id",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const member = await findMemberByIdForChurch({
      memberId: parsed.data.id,
      churchId: authUser.churchId
    });

    if (!member) {
      return reply.status(404).send({
        message: "Member not found"
      });
    }

    return reply.send({
      data: formatMember(member)
    });
  });

  app.post("/core/members", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) return;

    const parsed = createMemberSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid member creation request",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    try {
      const member = await createMember({
        churchId: authUser.churchId,
        createdBy: authUser.userId,
        ...parsed.data
      });

      return reply.status(201).send({
        message: "Member created successfully",
        data: formatMember(member)
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        return reply.status(409).send({
          message: "A member with this member code already exists"
        });
      }

      throw error;
    }
  });

  app.put("/core/members/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) return;

    const paramsParsed = memberParamsSchema.safeParse(request.params);

    if (!paramsParsed.success) {
      return reply.status(400).send({
        message: "Invalid member id",
        errors: paramsParsed.error.flatten().fieldErrors
      });
    }

    const bodyParsed = updateMemberSchema.safeParse(request.body);

    if (!bodyParsed.success) {
      return reply.status(400).send({
        message: "Invalid member update request",
        errors: bodyParsed.error.flatten().fieldErrors
      });
    }

    try {
      const member = await updateMemberForChurch({
        memberId: paramsParsed.data.id,
        churchId: authUser.churchId,
        ...bodyParsed.data
      });

      if (!member) {
        return reply.status(404).send({
          message: "Member not found"
        });
      }

      return reply.send({
        message: "Member updated successfully",
        data: formatMember(member)
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        return reply.status(409).send({
          message: "A member with this member code already exists"
        });
      }

      throw error;
    }
  });
}
