// src/types/winston.d.ts
import winston from 'winston';

declare module 'winston' {
    interface Logger {
        fatal: winston.LeveledLogMethod;
        http: winston.LeveledLogMethod;
        verbose: winston.LeveledLogMethod;
        silly: winston.LeveledLogMethod;
    }
}

export default logger;