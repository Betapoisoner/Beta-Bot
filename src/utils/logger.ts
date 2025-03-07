import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});
const logLevel = process.env.LOG_LEVEL || 'info';
// Create a Winston logger
const logger = winston.createLogger({
    level: logLevel, // Set the minimum log level (e.g., 'info', 'debug', 'error')
    format: winston.format.combine(
        winston.format.colorize(), // Keep colorize
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }), // Add metadata format

        logFormat // Apply custom log format
    ),
    transports: [
        // Log to the console
        new winston.transports.Console(),
        // Log to a rotating file
        new DailyRotateFile({
            filename: 'logs/bot-%DATE%.log',
            datePattern: 'DD-MM-YYYY',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});

export default logger;