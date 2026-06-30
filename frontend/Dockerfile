FROM node:22-alpine AS builder

WORKDIR /app

RUN chown -R node:node /app

COPY --chown=node:node frontend/package*.json ./

USER node

RUN npm ci

COPY --chown=node:node frontend/ ./

ARG VITE_AUTH_API_URL
ARG VITE_CHURCH_CORE_API_URL
ARG VITE_DOCUMENT_API_URL
ARG VITE_DEFAULT_LANGUAGE=fr

ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_CHURCH_CORE_API_URL=$VITE_CHURCH_CORE_API_URL
ENV VITE_DOCUMENT_API_URL=$VITE_DOCUMENT_API_URL
ENV VITE_DEFAULT_LANGUAGE=$VITE_DEFAULT_LANGUAGE

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080
