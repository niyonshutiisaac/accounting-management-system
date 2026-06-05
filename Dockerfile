# Multi-stage production Build for KoraBooks Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install all workspace dependencies
RUN npm ci

# Copy full application codebase
COPY . .

# Run production compilers (SPA production static files and nested server.ts)
RUN npm run build

# Stage 2: Final clean production container environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary configuration and compiled artifacts
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db.json ./db.json

# Install production node dependencies only
RUN npm ci --only=production

# Expose routing port default
EXPOSE 3000

# Fire up compiled enterprise Express backend
CMD ["node", "dist/server.cjs"]
