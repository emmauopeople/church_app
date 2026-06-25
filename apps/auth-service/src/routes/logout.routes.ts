import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createAuthAudit } from "../repositories/auth-audit.repository.js";
import { findSessionUserById } from "../repositories/user-session.repository.js";
import { verifyAccessToken } from "../utils/jwt.js";

function getBearerToken(request: FastifyRequest): string | null {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function logoutRoutes(app: FastifyInstance) {
  app.post("/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    const ipAddress = request.ip;
    const userAgent = request.headers["user-agent"] ?? null;
    const token = getBearerToken(request);

    if (!token) {
      return reply.send({ message: "Logout completed" });
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await findSessionUserById(payload.userId);

      await createAuthAudit({
        churchId: payload.churchId,
        userId: payload.userId,
        email: user?.email ?? null,
        action: "LOGOUT",
        status: "SUCCESS",
        ipAddress,
        userAgent
      });
    } catch {
      await createAuthAudit({
        action: "LOGOUT",
        status: "FAILED",
        reason: "TOKEN_NOT_VALID",
        ipAddress,
        userAgent
      });
    }

    return reply.send({ message: "Logout completed" });
  });
}
