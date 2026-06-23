FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/church-core-service/package*.json ./apps/church-core-service/

RUN npm install --workspace=church-core-service

COPY apps/church-core-service ./apps/church-core-service

RUN npm run build --workspace=church-core-service
RUN npm prune --omit=dev --workspace=church-core-service

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=4002
ENV SERVICE_NAME=church-core-service
ENV LOG_LEVEL=info

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/church-core-service/package*.json ./apps/church-core-service/
COPY --from=builder /app/apps/church-core-service/dist ./apps/church-core-service/dist

USER node

EXPOSE 4002

CMD ["node", "apps/church-core-service/dist/server.js"]
