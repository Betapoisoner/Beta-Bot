/**
 * Environment variable validation and type safety
 * Uses envalid for robust env var handling
 */
import { cleanEnv, str, num } from 'envalid';
import { config } from 'dotenv';

// Load environment variables before validation to support multiple environments
config({ path: process.env.ENV_PATH || '.env' });

/**
 * Validated environment variables
 * @typedef {Object} EnvVars
 * @property {string} DB_USER - PostgreSQL username
 * @property {string} DB_HOST - Database host address
 * @property {string} DB_NAME - Database name
 * @property {string} DB_PASSWORD - Database password
 * @property {number} DB_PORT - Database port (default: 5432)
 * @property {string} DISCORD_TOKEN - Bot authentication token
 * @property {string} APPLICATION_ID - Discord application ID
 * @property {string} GUILD_ID - Development server ID (optional)
 */
export const env = cleanEnv(process.env, {
    DB_USER: str({ desc: 'PostgreSQL username' }),
    DB_HOST: str({ desc: 'Database host address' }),
    DB_NAME: str({ desc: 'Database name' }),
    DB_PASSWORD: str({ desc: 'Database password' }),
    DB_PORT: num({ default: 5432, desc: 'Database port' }),
    DISCORD_TOKEN: str({ desc: 'Discord bot token' }),
    APPLICATION_ID: str({ desc: 'Discord application ID' }),
    GUILD_ID: str({ default: '', desc: 'Development server ID' }),
});
