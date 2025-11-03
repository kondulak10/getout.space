# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for canvas
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    python3

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code and scripts
COPY src ./src
COPY scripts ./scripts

# Build TypeScript (prebuild script will generate version automatically)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build and runtime dependencies for canvas
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    pixman-dev \
    python3 \
    cairo \
    pango \
    jpeg \
    giflib \
    pixman

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Remove build dependencies to reduce image size
RUN apk del build-base cairo-dev pango-dev jpeg-dev giflib-dev pixman-dev python3

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
