# Backend Proxy

A production-ready, region-aware proxy server that routes HTTP and WebSocket traffic to different backend servers based on region headers.

## Features

✅ **Production-Ready**
- Structured logging with log levels
- Health check endpoints on all services
- Graceful shutdown handling
- Error handling and recovery
- Redis connection retry logic
- WebSocket ping/pong keepalive

✅ **Configuration Management**
- Centralized config with environment variable support
- `.env` file support for easy configuration
- Sensible defaults for development

✅ **Monitoring & Observability**
- Request logging with duration tracking
- Connection tracking (WebSocket clients)
- Structured log output (timestamp, level, context)
- Health endpoints for load balancers

✅ **Zero External Dependencies**
- Redis runs in-memory via npm (development)
- One command to start everything
- Easy to configure for external Redis (production)

## Quick Start

```bash
. "$HOME/.nvm/nvm.sh"
npm install
npm start
```

This starts 6 services:
- Redis (port 6379) - in-memory
- Proxy (port 3000) - with health checks
- HTTP Server A (port 4001) - Region 1
- HTTP Server B (port 4002) - Region 2
- WebSocket Server 1 (port 5001) - Region 1
- WebSocket Server 2 (port 5002) - Region 2

## Test It

```bash
# Test Region 1
curl -H "x-region: 1" http://localhost:3000/
# Returns: Hello from Server A (Region 1)

# Test Region 2
curl -H "x-region: 2" http://localhost:3000/
# Returns: Hello from Server B (Region 2)

# Health Checks
curl http://localhost:3000/health    # Proxy
curl http://localhost:4001/health    # Server A
curl http://localhost:4002/health    # Server B
```

## Architecture

```
Client → Proxy → Routes by region header
              ↓
    Region 1: Server A (4001) + WS1 (5001)
    Region 2: Server B (4002) + WS2 (5002)
              ↓
         Redis Pub/Sub (cross-region messaging)
```

## Configuration

Copy `.env.example` to `.env` to customize:

```bash
cp .env.example .env
```

Available environment variables:
- `PROXY_PORT` - Proxy server port (default: 3000)
- `HTTP_SERVER_A_PORT` - HTTP Server A port (default: 4001)
- `HTTP_SERVER_B_PORT` - HTTP Server B port (default: 4002)
- `WS_SERVER_1_PORT` - WebSocket Server 1 port (default: 5001)
- `WS_SERVER_2_PORT` - WebSocket Server 2 port (default: 5002)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_HOST` - Redis host (default: 127.0.0.1)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)

## Production Deployment

### Using External Redis

1. Set environment variables:
```bash
export NODE_ENV=production
export REDIS_HOST=your-redis-host
export LOG_LEVEL=warn
```

2. Start only the application servers (not redis):
```bash
npm run dev:http  # HTTP servers + proxy
# Start WebSocket servers separately
npm run dev:ws1 &
npm run dev:ws2 &
```

### Health Checks

All services expose `/health` endpoints for load balancer health checks:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-04T...",
  "uptime": 123.456,
  "service": "proxy|server-a|server-b",
  "region": 1
}
```

### Logging

Structured logs with ISO timestamps:
```
[2025-12-04T...] [INFO] [Proxy] GET /health 200 - 2ms
[2025-12-04T...] [INFO] [WS1] User alice connected (total: 3)
[2025-12-04T...] [ERROR] [Redis] Redis connection failed
```

Log levels: `error` < `warn` < `info` < `debug`

Set via `LOG_LEVEL` environment variable.

## WebSocket Chat Demo

1. Open `client/index.html` in two browser tabs
2. Tab 1: User=`alice`, Target=`bob`, Region=1, Connect
3. Tab 2: User=`bob`, Target=`alice`, Region=2, Connect  
4. Send messages - they work across regions via Redis!

## How It Works

**HTTP Routing:**
- Client sends request with `x-region` header or `?region=` param
- Proxy forwards to appropriate backend server
- Requests are logged with duration

**WebSocket Messaging:**
- Each region has its own WebSocket server
- Connections require `userId` parameter
- Messages published to Redis: `chat:{userId}`
- Both WS servers subscribe to all channels
- Enables cross-region real-time messaging
- Ping/pong keepalive every 30s

**Error Handling:**
- Graceful shutdown on SIGTERM/SIGINT
- Redis connection retry with exponential backoff
- WebSocket error handling and connection validation
- HTTP 502 for backend failures
- Uncaught exception handling

## Files

```
config.ts             # Centralized configuration
logger.ts             # Structured logging
proxy.ts              # Region-aware proxy + health checks
start-redis.ts        # In-memory Redis server
servers/
  serverZA.ts        # HTTP Server A + health endpoint
  serverZB.ts        # HTTP Server B + health endpoint
  ws-server-1.ts     # WebSocket Server 1 + reconnection
  ws-server-2.ts     # WebSocket Server 2 + reconnection
client/
  index.html         # Chat UI
```

## Tech Stack

- TypeScript (ES modules, strict mode)
- Express v5 (HTTP servers)
- ws (WebSocket with ping/pong)
- redis v5 + redis-memory-server
- http-proxy-middleware (routing)
- concurrently (process orchestration)

## Stop Services

```bash
killall node
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use external Redis cluster
- [ ] Configure log aggregation (LOG_LEVEL=warn)
- [ ] Set up health check monitoring
- [ ] Configure reverse proxy (nginx/HAProxy)
- [ ] Enable HTTPS/TLS
- [ ] Set up metrics collection
- [ ] Configure backup and disaster recovery
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Set resource limits (CPU/memory)
- [ ] Configure log rotation
