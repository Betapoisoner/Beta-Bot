import { cleanEnv, str, num } from 'envalid';
import { Client } from 'pg';

const env = cleanEnv(process.env, {
    DB_USER: str(),
    DB_HOST: str(),
    DB_NAME: str(),
    DB_PASSWORD: str(),
    DB_PORT: num({ default: 5432 }),
    DISCORD_TOKEN: str(),
    APPLICATION_ID: str(),
    GUILD_ID: str({ default: '' }),
});

const db = new Client({
    user: env.DB_USER,
    host: env.DB_HOST,
    database: env.DB_NAME,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
});