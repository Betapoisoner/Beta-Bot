import { Client } from 'pg';
import { DBUtils, Puppet } from './interfaces/db';
import logger from './utils/logger';
import { env } from './env_validation';

const db = new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});

db.connect()
    .then(() => logger.info('Connected to PostgreSQL database', {
        event: 'databaseConnectSuccess',
        databaseType: 'PostgreSQL'
    }))
    .catch((err: Error) => {
        logger.error('Database connection error: ' + err, {
            event: 'databaseConnectError',
            databaseType: 'PostgreSQL',
            error: err
        });
        process.exit(1);
    });

export const dbUtils: DBUtils = {
    async getUserPuppets(userId: string): Promise<Puppet[]> {
        const res = await db.query('SELECT * FROM puppets WHERE user_id = $1', [userId]);
        return res.rows;
    },
    // Add new method for suffix lookup
    async getPuppetBySuffix(userId: string, suffix: string): Promise<Puppet | null> {
        const res = await db.query(
            'SELECT * FROM puppets WHERE user_id = $1 AND suffix = $2',
            [userId, suffix]
        );
        return res.rows[0] || null;
    },

    // Update create method
    async createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet> {
        const res = await db.query(
            `INSERT INTO puppets(user_id, name, suffix, avatar, description)
             VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [puppet.user_id, puppet.name, puppet.suffix,
            puppet.avatar, puppet.description]
        );
        return res.rows[0];
    }
, async getPuppetByName(userId: string, name: string): Promise<Puppet | null> {
        const res = await db.query(
            'SELECT * FROM puppets WHERE user_id = $1 AND name = $2',
            [userId, name]
        );
        return res.rows[0] || null;
    }
};