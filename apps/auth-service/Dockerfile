FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/auth-service/package*.json ./apps/auth-service/

RUN npm install --workspace=auth-service

COPY apps/auth-service ./apps/auth-service

RUN npm run build --workspace=auth-service
RUN npm prune --omit=dev --workspace=auth-service

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=4001
ENV SERVICE_NAME=auth-service
ENV LOG_LEVEL=info

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/auth-service/package*.json ./apps/auth-service/
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist

USER node

EXPOSE 4001

CMD ["node", "apps/auth-service/dist/server.js"]
