import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { createLoginLog } from "../repositories/login-log.repository.js";
import { createUser, findUserByEmail, listUsersByChurch, updateLastLogin } from "../repositories/user.repository.js";
import { findSessionUserById } from "../repositories/user-session.repository.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]).default("USER")
});

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

async function getActiveSessionUser(request: FastifyRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  const user = await findSessionUserById(payload.userId);

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

async function requireActiveAdmin(request: FastifyRequest, reply: FastifyReply) {
  let currentUser;

  try {
    currentUser = await getActiveSessionUser(request);
  } catch {
    reply.status(401).send({
      message: "Invalid or expired token"
    });
    return null;
  }

  if (!currentUser) {
    reply.status(401).send({
      message: "Authentication required"
    });
    return null;
  }

  if (currentUser.role !== "ADMIN") {
    reply.status(403).send({
      message: "Admin access required"
    });
    return null;
  }

  return currentUser;
}

function formatUser(user: {
  id: string;
  church_id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  created_at?: Date;
  last_login_at?: Date | null;
}) {
  return {
    id: user.id,
    churchId: user.church_id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  };
}

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

  app.get("/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await getActiveSessionUser(request);

      if (!user) {
        return reply.status(401).send({
          message: "Invalid or expired token"
        });
      }

      return reply.send({
        user: {
          id: user.id,
          churchId: user.church_id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch {
      return reply.status(401).send({
        message: "Invalid or expired token"
      });
    }
  });

  app.get("/auth/users", async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = await requireActiveAdmin(request, reply);

    if (!currentUser) {
      return;
    }

    const users = await listUsersByChurch(currentUser.church_id);

    return reply.send({
      data: users.map(formatUser)
    });
  });

  app.post("/auth/users", async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = await requireActiveAdmin(request, reply);

    if (!currentUser) {
      return;
    }

    const parsed = createUserSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        message: "Invalid user creation request",
        errors: parsed.error.flatten().fieldErrors
      });
    }

    const existingUser = await findUserByEmail(parsed.data.email);

    if (existingUser) {
      return reply.status(409).send({
        message: "A user with this email already exists"
      });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const newUser = await createUser({
      churchId: currentUser.church_id,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role
    });

    return reply.status(201).send({
      message: "User created successfully",
      user: formatUser(newUser)
    });
  });
}
