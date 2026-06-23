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

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=4003
ENV SERVICE_NAME=document-service
ENV LOG_LEVEL=info
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/document-service/package*.json ./apps/document-service/
COPY --from=builder /app/apps/document-service/dist ./apps/document-service/dist

USER node

EXPOSE 4003

CMD ["node", "apps/document-service/dist/server.js"]
