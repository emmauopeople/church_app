import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import { ensureAuthTables } from "./config/bootstrap.js";
import { db } from "./config/db.js";
import { registerMetrics } from "./plugins/metrics.js";
import { authRoutes } from "./routes/auth.routes.js";

const PORT = Number(process.env.PORT || 4001);
const HOST = "0.0.0.0";
const SERVICE_NAME = process.env.SERVICE_NAME || "auth-service";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = Fastify({
  logger: {
    level: LOG_LEVEL
  }
});

async function start() {
  await ensureAuthTables();

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet);
  await registerMetrics(app, SERVICE_NAME);

  app.get("/health", async () => {
    return {
      service: SERVICE_NAME,
      status: "ok",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/health/db", async () => {
    const result = await db.query("SELECT NOW() as now");

    return {
      service: SERVICE_NAME,
      database: "auth_db",
      status: "ok",
      time: result.rows[0].now
    };
  });

  await app.register(authRoutes);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Auth service running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
