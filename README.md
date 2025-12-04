# Backend Proxy System

Production-ready proxy with region routing, WebSocket support, and Redis pub/sub.

---

## 🚀 Quick Start

**Start everything:**
```bash
make up
```

**Test it:**
```bash
make test
```

**View logs:**
```bash
make logs
```

**Stop it:**
```bash
make down
```

---

## 📦 What It Does

Routes HTTP requests based on region header:
- `x-region: 1` → Server A (Port 3001)
- `x-region: 2` → Server B (Port 3002)

Routes WebSocket connections:
- `/ws1?userId=xxx` → WebSocket Server 1 (Port 4001)
- `/ws2?userId=xxx` → WebSocket Server 2 (Port 4002)

All WebSocket messages are broadcast via Redis pub/sub.

---

## 🧪 Test Commands

```bash
# HTTP Region 1
curl -H "x-region: 1" http://localhost:3000/

# HTTP Region 2
curl -H "x-region: 2" http://localhost:3000/

# Health Check
curl http://localhost:3000/health

# Web Client (Browser)
open http://localhost:3000/client/index.html

# WebSocket (install wscat: npm i -g wscat)
wscat -c "ws://localhost:3000/ws?userId=user123&region=1"
```

---

## 🛠️ All Commands

### Makefile (Recommended)
```bash
make up          # Start all services
make down        # Stop all services
make logs        # View logs
make test        # Run tests
make restart     # Restart services
make clean       # Complete cleanup
make help        # Show all commands
```

### Alternative: Docker Compose
```bash
docker-compose up -d       # Start
docker-compose logs -f     # Logs
docker-compose down -v     # Stop & clean
```

### Alternative: NPM (Development)
```bash
. "$HOME/.nvm/nvm.sh" && npm install    # First time only
. "$HOME/.nvm/nvm.sh" && npm start      # Start all
```

---

## 📊 Services

| Service | Port | What it does |
|---------|------|--------------|
| **Proxy** | 3000 | Main entry - routes by region |
| Server A | 3001 | Region 1 HTTP requests |
| Server B | 3002 | Region 2 HTTP requests |
| WebSocket 1 | 4001 | Real-time messaging |
| WebSocket 2 | 4002 | Real-time messaging |
| Redis | 6379 | Message broker |

---

## 🔧 Configuration

Copy `.env.example` to `.env` if you need custom ports:

```bash
PROXY_PORT=3000
SERVER_A_PORT=3001
SERVER_B_PORT=3002
WS_SERVER_1_PORT=4001
WS_SERVER_2_PORT=4002
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=INFO
```

---

## 🐛 Troubleshooting

**Ports already in use?**
```bash
killall node
make clean
make up
```

**Docker issues?**
```bash
docker-compose down -v
docker-compose up -d --build
```

**Check logs:**
```bash
make logs              # All logs
make logs-proxy        # Just proxy
```

---

## 📁 Project Files

```
proxy.ts              # Main proxy server
config.ts             # All configuration
logger.ts             # Logging system
start-redis.ts        # In-memory Redis
servers/
  ├── serverZA.ts     # HTTP Server A
  ├── serverZB.ts     # HTTP Server B
  ├── ws-server-1.ts  # WebSocket 1
  └── ws-server-2.ts  # WebSocket 2
```

---

**Tech Stack:** TypeScript, Node.js, Express, WebSocket, Redis, Docker
