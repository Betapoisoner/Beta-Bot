/**
 * Winston logger configuration with rotating file transport and custom levels
 * Provides structured logging for both console and file output
 */
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    verbose: 5,
    debug: 6,
    silly: 7
};

const logLevel = process.env.LOG_LEVEL || 'info';

type CustomLogger = winston.Logger & Record<keyof typeof logLevels, winston.LeveledLogMethod>;


const logger: CustomLogger = winston.createLogger({
    levels: logLevels,
    level: logLevel,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
                winston.format.printf((info) => {
                    const metadata = (info.metadata || {}) as Record<string, unknown>;
                    const metaString = Object.keys(metadata).length > 0
                        ? JSON.stringify(metadata, (_, value) => {
                            if (value instanceof Error) {
                                return {
                                    message: value.message,
                                    stack: value.stack,
                                    name: value.name
                                };
                            }
                            return value;
                        })
                        : '';
                    return `${info.timestamp} [${info.level}]: ${info.message} ${metaString}`;
                })
            )
        }),
        new DailyRotateFile({
            filename: 'logs/bot-%DATE%.log',
            datePattern: 'DD-MM-YYYY',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
}) as CustomLogger;

export default logger;