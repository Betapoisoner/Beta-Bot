import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import logger from './utils/logger'; // Import the logger

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;



if (!token || !applicationId) {
    logger.error('DISCORD_TOKEN and APPLICATION_ID must be defined in .env');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: [] });
            logger.info('Successfully cleared all guild commands.');
        } else {
            await rest.put(Routes.applicationCommands(applicationId), { body: [] });
            logger.info('Successfully cleared all global commands.');
        }
    } catch (error) {
        logger.error('Error clearing commands:', error);
    }
})();