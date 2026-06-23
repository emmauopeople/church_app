import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyAccessToken, type JwtUserPayload } from "../utils/jwt.js";

export function requireAuth(request: FastifyRequest, reply: FastifyReply): JwtUserPayload | null {
  try {
    const authorization = request.headers.authorization;

    if (!authorization) {
      reply.status(401).send({ message: "Authentication required" });
      return null;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      reply.status(401).send({ message: "Invalid authorization header" });
      return null;
    }

    return verifyAccessToken(token);
  } catch {
    reply.status(401).send({ message: "Invalid or expired token" });
    return null;
  }
}
