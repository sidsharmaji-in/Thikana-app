# ==========================================
# GharDekho Multi-Stage Production Dockerfile
# Production Slice P6
# ==========================================

# ------------------------------------------
# Stage 1: Build & Dependencies
# ------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root & server dependency manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --omit=dev && cd server && npm ci --omit=dev

# Copy application code
COPY . .

# ------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Create unprivileged uploads directory and assign ownership
RUN mkdir -p /app/uploads && chown -R node:node /app

# Copy built application from builder stage
COPY --from=builder --chown=node:node /app /app

# Switch to non-root unprivileged node user
USER node

# Expose HTTP & WebSocket port
EXPOSE 4000

# Production Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health/live || exit 1

# Start GharDekho server
CMD ["node", "server/src/index.js"]
