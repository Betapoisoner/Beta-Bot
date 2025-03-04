import { Client } from 'pg';
import { DBUtils } from './interfaces/db';
import logger from './utils/logger'; // Import the logger

const db = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});


db.connect()
    .then(() => logger.info('Connected to PostgreSQL database', { event: 'databaseConnectSuccess', databaseType: 'PostgreSQL' }))
    .catch((err: any) => logger.error('Database connection error: '+err, { event: 'databaseConnectError', databaseType: 'PostgreSQL', error: err }));
export const dbUtils: DBUtils = {

};