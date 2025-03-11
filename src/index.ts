import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import logger from './utils/logger';
import { replies } from './interactions/replies'; import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { dbUtils } from './db';

logger.info('Starting the Discord bot...', { event: 'botStartup' });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}
const token = process.env.DISCORD_TOKEN;

if (!token) {
    logger.error('Missing DISCORD_TOKEN in .env file.', {
        component: 'Configuration',
        issue: 'Environment Variable'
    });
    process.exit(1);
}

client.once('ready', () => {
    logger.info(`Logged in as ${client.user?.tag}`, {
        event: 'loginSuccess',
        botUsername: client.user?.tag
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.split(' ');
    // New suffix-based handling
    const suffixRegex = /^(.*?)(:{1,2})\s*(.*)/;
    const match = message.content.match(suffixRegex);

    if (match) {
        const [_, puppetName, suffixType, content] = match;

        try {
            const puppet = await dbUtils.getPuppetByName(message.author.id, puppetName.trim());

            if (!puppet) {
                return message.reply(`Puppet "${puppetName}" not found!`)
                    .then(msg => setTimeout(() => msg.delete(), 5000));
            }

            const isAction = suffixType === '::';

            const webhook = await (message.channel as TextChannel).createWebhook({
                name: puppet.name,
                avatar: puppet.avatar || undefined
            });

            await webhook.send({
                content: isAction ? `*${content}*` : content,
                username: puppet.name,
                avatarURL: puppet.avatar || undefined
            });

            await webhook.delete();
            await message.delete();

        } catch (error) {
            logger.error('Puppet error:', error);
            message.reply(`Puppet failed: ${getErrorMessage(error)}`)
                .then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }
    
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

client.login(token);