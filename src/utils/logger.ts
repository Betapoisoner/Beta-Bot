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

const logColors = {
    silly: 'rainbow',
    fatal: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    verbose: 'gray',
    debug: 'blue',
};

winston.addColors(logColors);

const LOG_DIRECTORY = path.join(__dirname, '../../logs');
const DEFAULT_LOG_LEVEL = 'info';
const LOG_FILE_PATTERN = 'DD-MM-YYYY';
const MAX_FILE_SIZE = '20m';
const MAX_FILES = '30d';

const errorReplacer = (_key: string, value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            message: value.message,
            stack: value.stack,
            name: value.name,
        };
    }
    // Handle circular references in HTTP request/response objects
    if (value && typeof value === 'object' && 'req' in value && 'res' in value) {
        const reqResObject = value as { req: unknown; res: unknown };
        const req = reqResObject.req;
        const res = reqResObject.res;

        const safeReq =
            req && typeof req === 'object' && 'method' in req && 'url' in req
                ? { method: (req as { method: unknown }).method, url: (req as { url: unknown }).url }
                : undefined;

        const safeRes =
            res && typeof res === 'object' && 'statusCode' in res && 'statusMessage' in res
                ? {
                    statusCode: (res as { statusCode: unknown }).statusCode,
                    statusMessage: (res as { statusMessage: unknown }).statusMessage,
                }
                : undefined;

        return {
            req: safeReq,
            res: safeRes,
        };
    }
    return value;
};

const formatConsoleOutput = (info: TransformableInfo): string => {
    const metadata = info.metadata as Record<string, unknown>;
    const metaString = Object.keys(metadata).length > 0 ? JSON.stringify(metadata, errorReplacer) : '';
    return `${info.timestamp} [${info.level}]: ${info.message} ${metaString}`;
};

const consoleFormat = winston.format.combine(
    winston.format.colorize({ colors: logColors }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    winston.format.printf(formatConsoleOutput),
);

const logger: Logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    format: winston.format.combine(
        winston.format.errors({ stack: true }), // Safely serialize errors
        winston.format.timestamp(),
        winston.format.json({ replacer: errorReplacer }),
    ),
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
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // Safely serialize errors
                winston.format.timestamp(),
                winston.format.json({ replacer: errorReplacer }),
            ),
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
            format: winston.format.combine(
                winston.format.errors({ stack: true }), // Safely serialize errors
                winston.format.timestamp(),
                winston.format.json({ replacer: errorReplacer }),
            ),
        }),
    ],
});

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        logger.close();
    });
});

logger.on('error', (error) => {
    console.error('Logger error:', error);
});

export default logger;