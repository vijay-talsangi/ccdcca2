# Multi-stage Dockerfile for Node.js application with Neon Database

# Stage 1: Base image with dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Development image
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
USER node
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 3: Build stage for production
FROM base AS build
COPY . .
RUN npm ci
RUN npm run lint
RUN npm run format:check

# Stage 4: Production image
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown nodejs:nodejs logs

EXPOSE 3000
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:3000/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

CMD ["dumb-init", "node", "src/index.js"]
