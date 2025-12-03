export const config = {
    // Server Ports
    PROXY_PORT: Number(process.env.PROXY_PORT) || 3000,
    HTTP_SERVER_A_PORT: Number(process.env.HTTP_SERVER_A_PORT) || 4001,
    HTTP_SERVER_B_PORT: Number(process.env.HTTP_SERVER_B_PORT) || 4002,
    WS_SERVER_1_PORT: Number(process.env.WS_SERVER_1_PORT) || 5001,
    WS_SERVER_2_PORT: Number(process.env.WS_SERVER_2_PORT) || 5002,
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    
    // Redis Configuration
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
    REDIS_RETRY_ATTEMPTS: 5,
    REDIS_RETRY_DELAY: 1000,
    
    // Server URLs
    HTTP_SERVERS: {
        1: process.env.HTTP_SERVER_1_URL || `http://localhost:${Number(process.env.HTTP_SERVER_A_PORT) || 4001}`,
        2: process.env.HTTP_SERVER_2_URL || `http://localhost:${Number(process.env.HTTP_SERVER_B_PORT) || 4002}`
    } as Record<number, string>,
    WS_SERVERS: {
        1: process.env.WS_SERVER_1_URL || `http://localhost:${Number(process.env.WS_SERVER_1_PORT) || 5001}`,
        2: process.env.WS_SERVER_2_URL || `http://localhost:${Number(process.env.WS_SERVER_2_PORT) || 5002}`
    } as Record<number, string>,
    
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Health Check
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    
    // WebSocket
    WS_PING_INTERVAL: 30000,
    WS_CONNECTION_TIMEOUT: 10000,
};
