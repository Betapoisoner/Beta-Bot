import { cleanEnv, str, num } from 'envalid';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables before validation
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const env = cleanEnv(process.env, {
    DB_USER: str(),
    DB_HOST: str(),
    DB_NAME: str(),
    DB_PASSWORD: str(),
    DB_PORT: num({ default: 5432 }),
    DISCORD_TOKEN: str(),
    APPLICATION_ID: str(),
    GUILD_ID: str({ default: '' }),
});

