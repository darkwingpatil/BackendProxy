enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

class Logger {
    private level: LogLevel;
    private context: string;

    constructor(context: string) {
        this.context = context;
        const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
        this.level = LogLevel[envLevel as keyof typeof LogLevel] || LogLevel.INFO;
    }

    private log(level: LogLevel, message: string, ...args: any[]) {
        if (level <= this.level) {
            const timestamp = new Date().toISOString();
            const levelName = LogLevel[level];
            const prefix = `[${timestamp}] [${levelName}] [${this.context}]`;
            console.log(prefix, message, ...args);
        }
    }

    error(message: string, ...args: any[]) {
        this.log(LogLevel.ERROR, message, ...args);
    }

    warn(message: string, ...args: any[]) {
        this.log(LogLevel.WARN, message, ...args);
    }

    info(message: string, ...args: any[]) {
        this.log(LogLevel.INFO, message, ...args);
    }

    debug(message: string, ...args: any[]) {
        this.log(LogLevel.DEBUG, message, ...args);
    }
}

export default Logger;
