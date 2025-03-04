import { Client, GatewayIntentBits } from 'discord.js';

import dotenv from 'dotenv';
import logger from './utils/logger';// Load .env file
import { replies } from './interactions/replies';
import { dbUtils } from './db';
dotenv.config();

logger.info('Starting the Discord bot...', { event: 'botStartup' }); // Metadata for bot startup

dbUtils
// Create a new Discord client with the required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Required for basic guild (server) functionality
        GatewayIntentBits.GuildMessages, // Required for receiving message events
        GatewayIntentBits.MessageContent, // Required for reading message content
    ],
});

const token = process.env.DISCORD_TOKEN;

if (!token) {
    logger.error('Missing DISCORD_TOKEN in .env file.', { component: 'Configuration', issue: 'Environment Variable' }); // Error level log with metadata    process.exit(1);
}

client.once('ready', () => {
    logger.info(`Logged in as  ${client.user?.tag}`, { event: 'loginSuccess', botUsername: `${client.user?.tag}` });
});

client.on('messageCreate', (message) => {
    

    // Ignore messages from bots
    if (message.author.bot) return;

    // Split the message content into command and arguments
    const [command, ...args] = message.content.split(' ');
    
    // Check if the command exists in the replies object
    if (replies[command]) {
        logger.debug(`Received message: ${message.content} from ${message.author.tag}`); // Debug level log
        // Execute the corresponding reply function with arguments
        replies[command](message, args);
    } else {
        // Handle unknown commands
        message.reply('Unknown command. Try `!help` for a list of commands.');
    }
});

client.login(token);