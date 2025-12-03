FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g tsx

# Copy source code
COPY config.ts ./
COPY logger.ts ./
COPY proxy.ts ./
COPY start-redis.ts ./
COPY servers/ ./servers/
COPY client/ ./client/

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3000 4001 4002 5001 5002 6379

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]
