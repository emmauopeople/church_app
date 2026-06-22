import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";

import { ensureDocumentTables } from "./config/bootstrap.js";
import { db } from "./config/db.js";
import { certificateRoutes } from "./routes/certificate.routes.js";
import { documentFileRoutes } from "./routes/document-file.routes.js";

const app = Fastify({
  logger: true
});

const PORT = Number(process.env.PORT || 4003);
const HOST = "0.0.0.0";

async function start() {
  await ensureDocumentTables();

  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });

  app.get("/health", async () => {
    return {
      service: "document-service",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  });

  app.get("/health/db", async () => {
    const result = await db.query("SELECT NOW() as now");

    return {
      service: "document-service",
      database: "document_core_db",
      status: "ok",
      time: result.rows[0].now
    };
  });

  await app.register(certificateRoutes);
  await app.register(documentFileRoutes);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Document service running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
