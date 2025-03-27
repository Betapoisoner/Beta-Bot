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
    }, async recordKick(userId: string, duration: string): Promise<void> {
        await db.query(
            `INSERT INTO server_sanctions (user_id, last_kick, kick_expires)
             VALUES ($1, NOW(), NOW() + INTERVAL '${duration}')
             ON CONFLICT (user_id) DO UPDATE
             SET last_kick = NOW(), kick_expires = NOW() + INTERVAL '${duration}'`,
            [userId]
        );
    },

    async updateReturnDate(userId: string): Promise<void> {
        await db.query(
            `UPDATE server_sanctions 
             SET return_date = NOW()
             WHERE user_id = $1`,
            [userId]
        );
    },

    async recordBan(userId: string): Promise<void> {
        await db.query(
            `UPDATE server_sanctions 
             SET ban_count = ban_count + 1
             WHERE user_id = $1`,
            [userId]
        );
    },

    async recordPermaBan(userId: string): Promise<void> {
        await db.query(
            `INSERT INTO server_sanctions (user_id, perma_banned)
             VALUES ($1, true)
             ON CONFLICT (user_id) DO UPDATE
             SET perma_banned = true`,
            [userId]
        );
    }, async getDetailedInfractions(userId: string): Promise<Array<{
        id: number;
        type: 'WARN' | 'KICK' | 'BAN' | 'MUTE';
        reason: string;
        created_at: Date;
        moderator_tag: string;
        duration?: string;
    }>> {
        const res = await db.query(
            `SELECT 
                i.id, 
                i.type,
                i.reason,
                i.created_at,
                m.username AS moderator_tag,
                s.kick_expires AS duration
             FROM infractions i
             LEFT JOIN members m ON i.moderator_id = m.user_id
             LEFT JOIN server_sanctions s ON i.user_id = s.user_id
             WHERE i.user_id = $1
             ORDER BY i.created_at DESC
             LIMIT 15`,
            [userId]
        );
        return res.rows;
    }
};