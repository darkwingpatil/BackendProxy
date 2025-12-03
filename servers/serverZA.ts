import express from "express";
import type { Request, Response } from "express";
import { config } from "../config.js";
import Logger from "../logger.js";

const logger = new Logger('ServerA');
const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'server-a',
        region: 1
    });
});

// Main endpoint
app.get("/", (req: Request, res: Response) => {
    res.send("Hello from Server A (Region 1)");
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
    logger.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.HTTP_SERVER_A_PORT, () => {
    logger.info(`Server A running on port ${config.HTTP_SERVER_A_PORT}`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
