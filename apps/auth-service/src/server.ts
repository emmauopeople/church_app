import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({
  logger: true
});

const PORT = Number(process.env.PORT || 4001);
const HOST = "0.0.0.0";

async function start() {
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(helmet);

  app.get("/health", async () => {
    return {
      service: "auth-service",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Auth service running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
