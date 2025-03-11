import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
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
        }),
    ],
});

export default logger;