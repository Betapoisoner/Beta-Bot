/**
 * Winston logger configuration with rotating file transport and custom levels
 * Provides structured logging for both console and file output
 */
import winston, { Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { TransformableInfo } from 'logform';

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    verbose: 5,
    silly: 6,
    debug: 7,
};

// Add custom color configuration
const logColors = {
    // Custom color only for silly
    silly: 'rainbow',

    // Standard Winston colors for other levels
    fatal: 'magenta',  // Standard default for highest severity
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',      // Matches default verbose color
    verbose: 'gray',
    debug: 'blue'
};

// Register custom colors
winston.addColors(logColors);

const LOG_DIRECTORY = path.join(__dirname, '../../logs');
const DEFAULT_LOG_LEVEL = 'info';
const LOG_FILE_PATTERN = 'DD-MM-YYYY';
const MAX_FILE_SIZE = '20m';
const MAX_FILES = '30d';

const formatConsoleOutput = (info: TransformableInfo): string => {
    const metadata = info.metadata as Record<string, unknown>;
    const metaString = Object.keys(metadata).length > 0 ? JSON.stringify(metadata, errorReplacer) : '';
    return `${info.timestamp} [${info.level}]: ${info.message} ${metaString}`;
};

const consoleFormat = winston.format.combine(
    // Apply custom colors through colorize
    winston.format.colorize({ colors: logColors }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    winston.format.printf(formatConsoleOutput),
);

// Rest of the configuration remains the same...
const errorReplacer = (_key: string, value: unknown): unknown =>
    value instanceof Error ? { message: value.message, stack: value.stack, name: value.name } : value;

const logger: Logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        new DailyRotateFile({
            dirname: path.join(LOG_DIRECTORY),
            filename: '%DATE%.log',
            datePattern: LOG_FILE_PATTERN,
            zippedArchive: true,
            maxSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES,
            utc: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
    ],
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        new DailyRotateFile({
            dirname: path.join(LOG_DIRECTORY, 'exceptions'),
            filename: '%DATE%.json',
            datePattern: LOG_FILE_PATTERN,
            zippedArchive: true,
            maxSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES,
            utc: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json({ replacer: errorReplacer })),
        }),
    ],
});

// Handle process termination and error logging remains the same...
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.close();
    });
});

logger.on('error', (error) => {
    console.error('Logger error:', error);
});

export default logger;