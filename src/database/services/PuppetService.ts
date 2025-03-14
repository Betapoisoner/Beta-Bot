/**
 * PostgreSQL database connection and utility functions
 * Handles all interactions with the Puppet storage system
 */
import { Client } from 'pg';

import { DBUtils, Puppet } from '../models/Puppet';
import logger from '@utils/logger';
import { env } from '@config/env';

// Configure PostgreSQL client with environment variables
const db = new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});

// Establish database connection with error handling
db.connect()
    .then(() =>
        logger.info('Connected to PostgreSQL database', {
            event: 'databaseConnectSuccess',
            databaseType: 'PostgreSQL',
        }),
    )
    .catch((err: Error) => {
        logger.error('Database connection error: ' + err, {
            event: 'databaseConnectError',
            databaseType: 'PostgreSQL',
            error: err,
        });
        process.exit(1);
    });

/**
 * Database utility functions for Puppet management
 * @namespace dbUtils
 */
export const dbUtils: DBUtils = {
    /**
     * Retrieve all puppets for a user
     * @param userId - Discord user ID
     * @returns Promise resolving to array of Puppet objects
     */
    async getUserPuppets(userId: string): Promise<Puppet[]> {
        const res = await db.query('SELECT * FROM puppets WHERE user_id = $1', [userId]);
        return res.rows;
    },

    /**
     * Find puppet by its unique suffix
     * @param userId - Owner's Discord user ID
     * @param suffix - Short identifier for the puppet
     * @returns Promise resolving to Puppet or null if not found
     */
    async getPuppetBySuffix(userId: string, suffix: string): Promise<Puppet | null> {
        const res = await db.query('SELECT * FROM puppets WHERE user_id = $1 AND suffix = $2', [userId, suffix]);
        return res.rows[0] || null;
    },

    /**
     * Create a new puppet in the database
     * @param puppet - Puppet data without auto-generated ID
     * @returns Promise resolving to created Puppet with ID
     */
    async createPuppet(puppet: Omit<Puppet, 'id'>): Promise<Puppet> {
        const res = await db.query(
            `INSERT INTO puppets(user_id, name, suffix, avatar, description)
             VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [puppet.user_id, puppet.name, puppet.suffix, puppet.avatar, puppet.description],
        );
        return res.rows[0];
    },

    /**
     * Find puppet by name (case-sensitive exact match)
     * @param userId - Owner's Discord user ID
     * @param name - Exact puppet name to search
     * @returns Promise resolving to Puppet or null if not found
     */
    async getPuppetByName(userId: string, name: string): Promise<Puppet | null> {
        const res = await db.query('SELECT * FROM puppets WHERE user_id = $1 AND name = $2', [userId, name]);
        return res.rows[0] || null;
    },
};
