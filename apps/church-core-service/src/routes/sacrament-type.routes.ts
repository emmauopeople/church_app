import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { requireAuth } from "../middlewares/auth.js";
import { listSacramentTypes } from "../repositories/sacrament-type.repository.js";

export async function sacramentTypeRoutes(app: FastifyInstance) {
  app.get("/core/sacrament-types", async (request: FastifyRequest, reply: FastifyReply) => {
    const authUser = requireAuth(request, reply);

    if (!authUser) {
      return;
    }

    const sacramentTypes = await listSacramentTypes();

    return reply.send({
      data: sacramentTypes.map((type) => ({
        id: type.id,
        code: type.code,
        name: type.name
      }))
    });
  });
}
