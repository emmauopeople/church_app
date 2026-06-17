import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { createLoginLog } from "../repositories/login-log.repository.js";
import { findUserByEmail, updateLastLogin } from "../repositories/user.repository.js";
import { signAccessToken } from "../utils/jwt.js";
import { verifyPassword } from "../utils/password.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid login request",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const { email, password } = parsed.data;
    const ipAddress = request.ip;
    const userAgent = request.headers["user-agent"] ?? null;

    const user = await findUserByEmail(email);

    if (!user) {
      await createLoginLog({
        emailAttempted: email,
        ipAddress,
        userAgent,
        status: "FAILED",
        failureReason: "USER_NOT_FOUND"
      });

      return reply.status(401).send({
        message: "Invalid email or password"
      });
    }

    if (user.status !== "ACTIVE") {
      await createLoginLog({
        userId: user.id,
        emailAttempted: email,
        ipAddress,
        userAgent,
        status: "FAILED",
        failureReason: "USER_INACTIVE"
      });

      return reply.status(403).send({
        message: "User account is inactive"
      });
    }

    const passwordIsValid = await verifyPassword(password, user.password_hash);

    if (!passwordIsValid) {
      await createLoginLog({
        userId: user.id,
        emailAttempted: email,
        ipAddress,
        userAgent,
        status: "FAILED",
        failureReason: "INVALID_PASSWORD"
      });

      return reply.status(401).send({
        message: "Invalid email or password"
      });
    }

    await updateLastLogin(user.id);

    await createLoginLog({
      userId: user.id,
      emailAttempted: email,
      ipAddress,
      userAgent,
      status: "SUCCESS"
    });

    const accessToken = signAccessToken({
      userId: user.id,
      churchId: user.church_id,
      role: user.role
    });

    return reply.send({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        churchId: user.church_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  });
}
