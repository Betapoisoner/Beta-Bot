/**
 * Main Discord bot entry point
 * Handles client initialization and core event listeners
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import logger from './utils/logger';
import { replies } from './interactions/replies';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { dbUtils } from './db';

logger.info('Starting the Discord bot...', { event: 'botStartup' });

// Configure Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

/**
 * Safely extract error message from unknown error type
 * @param error - Caught error object
 * @returns Human-readable error message
 */
function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// Validate token presence before starting
const token = process.env.DISCORD_TOKEN;
if (!token) {
    logger.error('Missing DISCORD_TOKEN in .env file.', {
        component: 'Configuration',
        issue: 'Environment Variable'
    });
    process.exit(1);
}

// Bot ready event handler
client.once('ready', () => {
    logger.info(`Logged in as ${client.user?.tag}`, {
        event: 'loginSuccess',
        botUsername: client.user?.tag
    });
});

// Message processing handler
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Handle suffix-based puppet messages (e.g., "pup: Hello!")
    const suffixRegex = /^(\S+)(:{1,2})\s+(.*)/;
    const match = message.content.match(suffixRegex);

    if (match) {
        // Process puppet message flow
        const [_, suffix, suffixType, content] = match;

        try {
            const puppet = await dbUtils.getPuppetBySuffix(message.author.id, suffix);
            if (!puppet) {
                return message.reply(`No puppet with suffix "${suffix}" found!`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
            }

            // Create temporary webhook for puppet messaging
            const webhook = await (message.channel as TextChannel).createWebhook({
                name: puppet.name,
                avatar: puppet.avatar || undefined
            });

            const isAction = suffixType === '::';
            await webhook.send({
                content: isAction ? `*${content}*` : content,
                username: puppet.name,
                avatarURL: puppet.avatar || undefined
            });

            // Cleanup webhook and original message
            await webhook.delete();
            await message.delete();

        } catch (error) {
            logger.error('Puppet error:', error);
            message.reply(`Puppet failed: ${getErrorMessage(error)}`)
                .then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }

    // Handle traditional command messages
    const [command, ...args] = message.content.split(' ');
    if (replies[command]) {
        logger.debug(`Received command: ${command}`, {
            user: message.author.tag,
            content: message.content
        });

        try {
            await replies[command](message, args);
        } catch (error) {
            logger.error(`Error handling command ${command}: ${error}`, {
                command,
                error
            });
            message.reply('An error occurred while processing your command.');
        }
    }
});

// Start bot connection
client.login(token);