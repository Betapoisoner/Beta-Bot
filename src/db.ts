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
    .catch((err: any) => {
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
    async createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet> {
        const res = await db.query(
            'INSERT INTO puppets(user_id, name, avatar, description) VALUES($1, $2, $3, $4) RETURNING *',
            [puppet.user_id, puppet.name, puppet.avatar, puppet.description]
        );
        return res.rows[0];
    }, async getPuppetByName(userId: string, name: string): Promise<Puppet | null> {
        const res = await db.query(
            'SELECT * FROM puppets WHERE user_id = $1 AND name = $2',
            [userId, name]
        );
        return res.rows[0] || null;
    }
};