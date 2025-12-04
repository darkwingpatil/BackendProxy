import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import httpProxy from "http-proxy";
import { config } from "./config.js";
import Logger from "./logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static client files
app.use('/client', express.static(path.join(__dirname, 'client')));

// Redirect root to client
app.get('/', (req: Request, res: Response, next: NextFunction) => {
    // Only serve HTML if it's a browser request (not API)
    if (req.headers.accept?.includes('text/html')) {
        res.redirect('/client/index.html');
    } else {
        next();
    }
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

// Test endpoint to verify proxy is working
app.get('/test-ws', (req: Request, res: Response) => {
    res.json({
        message: 'WebSocket proxy is configured',
        wsServers: config.WS_SERVERS
    });
});

function getRegion(req: Request): number {
    const region = Number(req.headers["x-region"] || req.query.region) || 1;
    logger.debug(`Region determined: ${region}`);
    return region;
}

function getRegionFromUpgrade(req: any): number {
    // For upgrade requests, parse the URL to get query params
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const region = Number(req.headers["x-region"] || url.searchParams.get('region')) || 1;
    logger.debug(`Region determined from upgrade: ${region}`);
    return region;
}

// Create direct http-proxy for WebSocket handling
const wsProxyServer = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true
});

// Handle WebSocket proxy errors
wsProxyServer.on('error', (err: Error, req: any, socket: any) => {
    logger.error('WebSocket proxy error:', err);
    socket.destroy();
});

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

// Attach WebSocket upgrade handler
server.on('upgrade', (req, socket, head) => {
    logger.info(`WebSocket upgrade request for: ${req.url}`);
    
    if (req.url?.startsWith('/ws')) {
        // Determine region and target
        const region = getRegionFromUpgrade(req);
        const target = config.WS_SERVERS[region] || config.WS_SERVERS[1];
        logger.info(`Proxying WebSocket to region ${region}: ${target}`);
        
        // Remove /ws prefix from the path
        const originalUrl = req.url;
        req.url = req.url.replace(/^\/ws/, '');
        
        try {
            // Proxy the WebSocket upgrade
            wsProxyServer.ws(req, socket, head, { target }, (err: Error | undefined) => {
                if (err) {
                    logger.error('WebSocket proxy error:', err);
                    socket.destroy();
                }
            });
        } catch (err) {
            logger.error('WebSocket upgrade exception:', err);
            socket.destroy();
        }
        
        // Restore original URL for logging
        req.url = originalUrl;
    } else {
        logger.warn(`Rejected WebSocket upgrade for: ${req.url}`);
        socket.destroy();
    }
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
