import type { FastifyInstance, FastifyRequest } from "fastify";
import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({
  register
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["service", "method", "route", "status_code"] as const,
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["service", "method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

const appInfo = new client.Gauge({
  name: "app_info",
  help: "Application metadata",
  labelNames: ["service"] as const,
  registers: [register]
});

export async function registerMetrics(app: FastifyInstance, serviceName: string) {
  appInfo.set({ service: serviceName }, 1);

  const requestStartTimes = new WeakMap<FastifyRequest, bigint>();

  app.addHook("onRequest", async (request) => {
    requestStartTimes.set(request, process.hrtime.bigint());
  });

  app.addHook("onResponse", async (request, reply) => {
    if (request.url === "/metrics") {
      return;
    }

    const start = requestStartTimes.get(request);
    const durationSeconds = start
      ? Number(process.hrtime.bigint() - start) / 1_000_000_000
      : 0;

    const labels = {
      service: serviceName,
      method: request.method,
      route: request.routeOptions?.url ?? request.url,
      status_code: String(reply.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", register.contentType);
    return register.metrics();
  });
}
