import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

import { db } from "./config/db.js";
import { memberRoutes } from "./routes/member.routes.js";
import { sacramentTypeRoutes } from "./routes/sacrament-type.routes.js";

const app = Fastify({
  logger: true
});

const PORT = Number(process.env.PORT || 4002);
const HOST = "0.0.0.0";

async function start() {
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet);

  app.get("/health", async () => {
    return {
      service: "church-core-service",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/health/db", async () => {
    const result = await db.query("SELECT NOW() as now");

    return {
      service: "church-core-service",
      database: "church_core_db",
      status: "ok",
      time: result.rows[0].now
    };
  });

  await app.register(memberRoutes);
  await app.register(sacramentTypeRoutes);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Church core service running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
