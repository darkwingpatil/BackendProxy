import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "./config.js";
import Logger from "./logger.js";

const logger = new Logger('Proxy');
const app = express();

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'proxy'
    });
});

function getRegion(req: Request): number {
    const region = Number(req.headers["x-region"] || req.query.region) || 1;
    logger.debug(`Region determined: ${region}`);
    return region;
}

// WebSocket proxy with error handling
app.use("/ws", createProxyMiddleware({
    ws: true,
    changeOrigin: true,
    router: (req: Request) => {
        const region = getRegion(req);
        const target = config.WS_SERVERS[region] || config.WS_SERVERS[1];
        logger.info(`WebSocket routing to region ${region}: ${target}`);
        return target;
    }
}));

// HTTP proxy with error handling
app.use("/", createProxyMiddleware({
    changeOrigin: true,
    router: (req: Request) => {
        const region = getRegion(req);
        const target = config.HTTP_SERVERS[region] || config.HTTP_SERVERS[1];
        logger.debug(`HTTP routing to region ${region}: ${target}`);
        return target;
    }
}));

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.PROXY_PORT, () => {
    logger.info(`Proxy server running on port ${config.PROXY_PORT}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
