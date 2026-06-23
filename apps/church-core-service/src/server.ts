import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import { db } from "./config/db.js";
import { registerMetrics } from "./plugins/metrics.js";
import { memberRoutes } from "./routes/member.routes.js";
import { sacramentRoutes } from "./routes/sacrament.routes.js";
import { sacramentTypeRoutes } from "./routes/sacrament-type.routes.js";

const PORT = Number(process.env.PORT || 4002);
const HOST = "0.0.0.0";
const SERVICE_NAME = process.env.SERVICE_NAME || "church-core-service";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = Fastify({
  logger: {
    level: LOG_LEVEL
  }
});

async function start() {
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
      database: "church_core_db",
      status: "ok",
      time: result.rows[0].now
    };
  });

  await app.register(memberRoutes);
  await app.register(sacramentTypeRoutes);
  await app.register(sacramentRoutes);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Church core service running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
