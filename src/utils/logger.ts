/**
 * Winston logger configuration with rotating file transport and custom levels
 * Provides structured logging for both console and file output
 */
import winston, { Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Format, TransformableInfo } from 'logform';
import fs from 'fs';

const logLevels = {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    verbose: 5,
    debug: 6,
    silly: 7,
};

type LogLevel = keyof typeof logLevels;

const LOG_DIRECTORY = path.join(__dirname, '../../logs');
const DEFAULT_LOG_LEVEL = 'info';
const LOG_FILE_PATTERN = 'DD-MM-YYYY';
const MAX_FILE_SIZE = '20m';
const MAX_FILES = '30d';

Object.keys(logLevels).forEach(level => {
    const dir = path.join(LOG_DIRECTORY, level);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const getFileFormat = (level: LogLevel): Format => winston.format.combine(
    winston.format((info: TransformableInfo) => {
        return info.level === level ? info : false;
    })(),
    winston.format.timestamp(),
    winston.format.json()
);

// Helper functions for common configurations
const createFileTransport = (level: LogLevel): DailyRotateFile => new DailyRotateFile({
    dirname: path.join(LOG_DIRECTORY, level),
    filename: 'discord-bot-%DATE%.log',
    datePattern: LOG_FILE_PATTERN,
    zippedArchive: true,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    utc: true,
    format: getFileFormat(level), // Pass the level string here
});;



const formatConsoleOutput = (info: TransformableInfo): string => {
    const metadata = info.metadata as Record<string, unknown>;
    const metaString = Object.keys(metadata).length > 0
        ? JSON.stringify(metadata, errorReplacer)
        : '';
    return `${info.timestamp} [${info.level}]: ${info.message} ${metaString}`;
};

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    winston.format.printf(formatConsoleOutput)
);

const errorReplacer = (_key: string, value: unknown): unknown =>
    value instanceof Error
        ? { message: value.message, stack: value.stack, name: value.name }
        : value;

const logger: Logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    transports: [
        new winston.transports.Console({ format: consoleFormat }),
        ...Object.keys(logLevels).map(level => createFileTransport(level as LogLevel)),
        new DailyRotateFile({
            dirname: path.join(LOG_DIRECTORY, 'combined'),
            filename: 'discord-bot-%DATE%.log',
            datePattern: LOG_FILE_PATTERN,
            zippedArchive: true,
            maxSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES,
            utc: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            dirname: path.join(LOG_DIRECTORY, 'exceptions'),
            filename: '%DATE%.log',
            datePattern: LOG_FILE_PATTERN,
            zippedArchive: true,
            maxSize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES,
            utc: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
});

logger.on('error', (error) => {
    console.error('Logger error:', error);
});

// Handle process termination
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
        logger.info(`${signal} received - closing logger transports`);
        logger.close();
    });
});

export default logger;