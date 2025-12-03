import { RedisMemoryServer } from 'redis-memory-server';
import { config } from './config.js';
import Logger from './logger.js';

const logger = new Logger('Redis');

async function startRedis() {
    try {
        logger.info('Starting Redis memory server...');
        
        const redisServer = await RedisMemoryServer.create({
            instance: {
                port: config.REDIS_PORT,
            },
        });
        
        const host = await redisServer.getHost();
        const port = await redisServer.getPort();
        
        logger.info(`Redis running on ${host}:${port}`);
        
        // Graceful shutdown
        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received, stopping Redis...`);
            await redisServer.stop();
            logger.info('Redis server stopped');
            process.exit(0);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        process.on('uncaughtException', async (err) => {
            logger.error('Uncaught exception:', err);
            await redisServer.stop();
            process.exit(1);
        });
        
    } catch (err) {
        logger.error('Failed to start Redis:', err);
        process.exit(1);
    }
}

startRedis();
