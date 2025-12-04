import { WebSocketServer } from "ws";
import type WebSocket from "ws";
import { createClient } from "redis";
import type { IncomingMessage } from "http";
import { config } from "../config.js";
import Logger from "../logger.js";

const logger = new Logger('WS1');

// Wait for Redis to be ready
await new Promise(resolve => setTimeout(resolve, 2000));

const wss = new WebSocketServer({ 
    port: config.WS_SERVER_1_PORT,
    perMessageDeflate: false
});

const pub = createClient({
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        reconnectStrategy: (retries) => {
            if (retries > config.REDIS_RETRY_ATTEMPTS) {
                logger.error('Redis connection failed after max retries');
                return new Error('Max retries reached');
            }
            return config.REDIS_RETRY_DELAY;
        }
    }
});

const sub = createClient({
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        reconnectStrategy: (retries) => {
            if (retries > config.REDIS_RETRY_ATTEMPTS) {
                return new Error('Max retries reached');
            }
            return config.REDIS_RETRY_DELAY;
        }
    }
});

pub.on('error', (err) => logger.error('Redis Pub error:', err));
sub.on('error', (err) => logger.error('Redis Sub error:', err));

try {
    await pub.connect();
    await sub.connect();
    logger.info('Connected to Redis');
} catch (err) {
    logger.error('Failed to connect to Redis:', err);
    process.exit(1);
}

const clients: Record<string, WebSocket> = {};

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", "http://localhost");
    const userId = url.searchParams.get("userId");

    if (!userId) {
        logger.warn('Connection rejected: no userId');
        ws.close(1008, 'userId required');
        return;
    }

    clients[userId] = ws;
    logger.info(`User ${userId} connected (total: ${Object.keys(clients).length})`);

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, config.WS_PING_INTERVAL);

    ws.on("message", (raw: WebSocket.RawData) => {
        try {
            const msg = JSON.parse(raw.toString());
            logger.debug(`Message from ${msg.from} to ${msg.to}`);
            pub.publish(`chat:${msg.to}`, raw.toString());
        } catch (err) {
            logger.error('Error processing message:', err);
        }
    });

    ws.on("close", (code, reason) => {
        clearInterval(pingInterval);
        if (userId) {
            delete clients[userId];
            logger.info(`User ${userId} disconnected (total: ${Object.keys(clients).length}) - Code: ${code}, Reason: ${reason.toString()}`);
        }
    });

    ws.on("error", (err) => {
        logger.error(`WebSocket error for user ${userId}:`, err);
    });
});

// Incoming messages from Redis
await sub.pSubscribe("chat:*", (raw: string, channel: string) => {
    const toUser = channel.split(":")[1];
    if (toUser && clients[toUser] && clients[toUser].readyState === clients[toUser].OPEN) {
        clients[toUser].send(raw);
        logger.debug(`Delivered message to ${toUser}`);
    }
});

logger.info(`WS Server 1 running on port ${config.WS_SERVER_1_PORT}`);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, closing connections...`);
    
    wss.clients.forEach((client) => {
        client.close(1000, 'Server shutting down');
    });
    
    wss.close(() => logger.info('WebSocket server closed'));
    
    await pub.quit();
    await sub.quit();
    logger.info('Redis connections closed');
    
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
