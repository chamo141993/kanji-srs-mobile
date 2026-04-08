# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-bookworm-slim AS runtime-prep
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js logger.js ./
RUN chown -R 65532:65532 /app

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=runtime-prep --chown=nonroot:nonroot /app /app
USER nonroot:nonroot
EXPOSE 8080
CMD ["server.js"]