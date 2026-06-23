FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY apps/document-service/package*.json ./apps/document-service/

RUN npm install --workspace=document-service

COPY apps/document-service ./apps/document-service

RUN npm run build --workspace=document-service
RUN npm prune --omit=dev --workspace=document-service

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=4003
ENV SERVICE_NAME=document-service
ENV LOG_LEVEL=info

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/document-service/package*.json ./apps/document-service/
COPY --from=builder /app/apps/document-service/dist ./apps/document-service/dist

EXPOSE 4003

CMD ["node", "apps/document-service/dist/server.js"]
