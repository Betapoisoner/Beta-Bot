declare const performance: {
    now(): number;
};

/**
 * Main Discord bot entry point
 * Handles client initialization and core event listeners
 */
import dotenv from 'dotenv';
import path from 'path';
import logger from './../utils/logger';

// Load environment variables first to ensure availability for subsequent modules
dotenv.config({ path: path.resolve(__dirname, '../.env') });
logger.debug('Environment variables loaded', {
    envKeys: Object.keys(process.env).filter(k => k.startsWith('DISCORD') || k.startsWith('DB'))
});

import { replies } from '../core/discord/utils/replies';
import { dbUtils } from '../database/services/PuppetService';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import type { Puppet } from '@database/models/Puppet';


logger.info('Initializing Discord bot client...', {
    nodeVersion: process.version,
    tsVersion: require('typescript/package.json').version
});

// Configure Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,        // Required for server data
        GatewayIntentBits.GuildMessages, // Needed for message events
        GatewayIntentBits.MessageContent, // Essential for reading message content
    ],
});

/**
 * Safely extracts error message from unknown error type
 * @param error - Caught error object of unknown type
 * @returns Human-readable error message string
 * 
 * @example
 * try { ... } catch (err) {
 *   logger.error(getErrorMessage(err));
 * }
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Unknown error type encountered';
}

// Validate token presence before starting bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
    logger.fatal('Missing DISCORD_TOKEN in environment configuration', {
        component: 'Authentication',
        severity: 'CRITICAL',
        envKeys: Object.keys(process.env)
    });
    process.exit(1);
}
logger.debug('Discord token validation passed', { tokenPreview: `${token?.slice(0, 3)}...${token?.slice(-3)}` });

// Bot ready event handler - fires once connection is established
client.once('ready', () => {
    logger.info(`Bot successfully logged in as ${client.user?.tag}`, {
        event: 'Connection',
        status: 'Authenticated',
        ping: client.ws.ping,
        guildCount: client.guilds.cache.size
    });

    logger.debug('Connected guilds list', {
        guilds: client.guilds.cache.map(g => ({
            id: g.id,
            name: g.name,
            memberCount: g.memberCount
        }))
    });
});

/**
 * Handles incoming message events with dual processing:
 * 1. Suffix-based puppet messages (e.g., "mrln:Hello")
 * 2. Traditional command messages (e.g., "!help")
 */
client.on('messageCreate', async (message) => {
    // Ignore messages from other bots to prevent loops
    if (message.author.bot) {
        logger.silly('Ignored bot-to-bot message', {
            author: message.author.tag,
            botId: message.author.id
        });
        return;
    }

    logger.debug('Processing new message', {
        userId: message.author.id,
        channelId: message.channel.id,
        contentPreview: message.content.slice(0, 50)
    });

    // Region: Suffix-based Message Handling
    const suffixRegex = /^(\S+)(:{1,2})(.*)/;  // Captures [suffix, colon(s), content]
    const match = message.content.match(suffixRegex);

    if (match) {
        const [_, suffix, suffixType, rawContent] = match;
        const content = rawContent.trim();

        logger.info('Detected suffix-based message', {
            userId: message.author.id,
            suffix,
            suffixType,
            contentLength: content.length
        });

        try {
            logger.debug('Querying database for puppet', {
                userId: message.author.id,
                suffix
            });

            const puppet = await dbUtils.getPuppetBySuffix(message.author.id, suffix);

            if (!puppet) {
                logger.warn('Puppet suffix lookup failed', {
                    userId: message.author.id,
                    suffix,
                    storedSuffixes: await dbUtils.getUserPuppets(message.author.id)
                        .then((puppets: Puppet[]) => puppets.map(p => p.suffix))
                });

                const reply = await message.reply(`No puppet with suffix "${suffix}" found!`);

                logger.debug('Scheduled ephemeral error reply', {
                    messageId: reply.id,
                    deleteIn: '5s'
                });

                return setTimeout(() => reply.delete(), 5000);
            }

            logger.info('Creating puppet webhook', {
                puppetName: puppet.name,
                channelId: message.channel.id,
                hasAvatar: !!puppet.avatar
            });

            const webhook = await (message.channel as TextChannel).createWebhook({
                name: puppet.name,
                avatar: puppet.avatar || undefined,
                reason: `Puppet activation by ${message.author.tag}`
            });

            const isAction = suffixType === '::';
            const processedContent = isAction ? `*${content}*` : content;

            logger.debug('Sending webhook message', {
                isAction,
                contentLength: processedContent.length,
                webhookId: webhook.id
            });

            await webhook.send({
                content: processedContent,
                username: puppet.name,
                avatarURL: puppet.avatar || undefined
            });

            logger.debug('Cleaning up webhook resources', {
                webhookId: webhook.id,
                originalMessageId: message.id
            });

            await Promise.all([
                webhook.delete(),
                message.delete()
            ]);

        } catch (error) {
            logger.error('Puppet message processing failed', {
                error: getErrorMessage(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: message.author.id,
                channelId: message.channel.id
            });

            const errorReply = await message.reply(`Puppet failed: ${getErrorMessage(error)}`);

            logger.debug('Scheduled error message cleanup', {
                errorMessageId: errorReply.id,
                deleteIn: '5s'
            });

            setTimeout(() => errorReply.delete(), 5000);
        }
        return;
    }
    // EndRegion

    // Region: Traditional Command Handling
    const [command, ...args] = message.content.split(' ');

    if (replies[command]) {
        logger.info('Processing command message', {
            command,
            argCount: args.length,
            userId: message.author.id
        });
        const startTime = performance.now();
        try {
            logger.debug('Executing command handler', {
                command,
                handler: replies[command].name
            });

            await replies[command](message, args);

            logger.debug('Command completed successfully', {
                command,
                executionTime: `${performance.now() - startTime}ms`
            });

        } catch (error) {
            logger.error(`Command '${command}' execution failed`, {
                error: getErrorMessage(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: message.author.id,
                args
            });

            const errorMessage = `Error processing ${command}: ${getErrorMessage(error)}`;

            if (message.deletable) {
                logger.debug('Attempting to delete failed command message', {
                    messageId: message.id
                });

                await message.delete().catch(logger.warn);
            }

            const reply = await message.reply(errorMessage);

            logger.debug('Scheduled command error reply cleanup', {
                replyId: reply.id,
                deleteIn: '15s'
            });

            setTimeout(() => reply.delete(), 15000);
        }
    }
    // EndRegion
});

// Initialize bot connection with error handling
client.login(token)
    .then(() => logger.info('Discord client login initiated'))
    .catch(error => {
        logger.fatal('Fatal connection error', {
            error: getErrorMessage(error),
            stack: error.stack
        });
        process.exit(1);
    });