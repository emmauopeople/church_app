import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyAccessToken, type JwtUserPayload } from "../utils/jwt.js";

export function getBearerToken(request: FastifyRequest): string | null {
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

export function getAuthUser(request: FastifyRequest): JwtUserPayload | null {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

export function requireAuth(request: FastifyRequest, reply: FastifyReply): JwtUserPayload | null {
  try {
    const user = getAuthUser(request);

    if (!user) {
      reply.status(401).send({ message: "Authentication required" });
      return null;
    }

    return user;
  } catch {
    reply.status(401).send({ message: "Invalid or expired token" });
    return null;
  }
}
