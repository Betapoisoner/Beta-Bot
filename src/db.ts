import { Client } from 'pg';
import { Puppet, DBUtils } from './interfaces/db';

const db = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

db.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch((err: any) => console.error('Database connection error:', err));

export const dbUtils: DBUtils = {
   
};