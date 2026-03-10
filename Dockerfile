# ── Build client ──
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Production server ──
FROM node:20-alpine
WORKDIR /app

# Install native deps for node-pty
RUN apk add --no-cache python3 make g++ bash

COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev

COPY server/src ./src

# Copy built client into server's public folder
COPY --from=client-build /app/client/dist ./public

# Environment
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3001/api/health || exit 1

CMD ["node", "src/index.js"]
