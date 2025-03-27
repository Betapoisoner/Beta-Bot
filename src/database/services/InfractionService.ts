import { Client } from 'pg';
import { Infraction } from '../models/Infraction';
import logger from '@utils/logger';
import { env } from '@config/env';

const db = new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});

db.connect()
    .then(() => logger.info('Connected to PostgreSQL for infractions'))
    .catch((err) => {
        logger.error('Infraction DB connection error:', err);
        process.exit(1);
    });

export const infractionService = {
    async addInfraction(infraction: Omit<Infraction, 'id' | 'created_at'>): Promise<Infraction> {
        const res = await db.query(
            `INSERT INTO infractions (user_id, moderator_id, type, reason)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [infraction.user_id, infraction.moderator_id, infraction.type, infraction.reason]
        );
        return res.rows[0];
    },

    async getUserInfractions(userId: string, type?: 'WARN' | 'KICK' | 'BAN'): Promise<Infraction[]> {
        const query = type 
            ? 'SELECT * FROM infractions WHERE user_id = $1 AND type = $2'
            : 'SELECT * FROM infractions WHERE user_id = $1';
        const params = type ? [userId, type] : [userId];
        const res = await db.query(query, params);
        return res.rows;
    },

    async getInfractionCount(userId: string, type: 'WARN' | 'KICK' | 'BAN'): Promise<number> {
        const res = await db.query(
            'SELECT COUNT(*) FROM infractions WHERE user_id = $1 AND type = $2',
            [userId, type]
        );
        return parseInt(res.rows[0].count, 10);
    },
    async getRecentWarnCount(userId: string, hours: number): Promise<number> {
        const res = await db.query(
            `SELECT COUNT(*) FROM infractions 
             WHERE user_id = $1 
             AND type = 'WARN' 
             AND created_at >= NOW() - INTERVAL '${hours} hours'`,
            [userId]
        );
        return parseInt(res.rows[0].count, 10);
    },

    async getUserSanctions(userId: string): Promise<any> {
        const res = await db.query(
            `SELECT * FROM server_sanctions WHERE user_id = $1`,
            [userId]
        );
        return res.rows[0] || { mute_count: 0, kick_count: 0, ban_count: 0 };
    },

    async incrementKickCount(userId: string): Promise<void> {
        await db.query(
            `INSERT INTO server_sanctions (user_id, kick_count)
             VALUES ($1, 1)
             ON CONFLICT (user_id) 
             DO UPDATE SET kick_count = server_sanctions.kick_count + 1`,
            [userId]
        );
    },

    async resetSanctions(userId: string): Promise<void> {
        await db.query(
            `DELETE FROM server_sanctions WHERE user_id = $1`,
            [userId]
        );
    }
};