import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import { dbUtils } from '../../../database/services/PuppetService';
import logger from '../../../utils/logger';
import type { Puppet } from '@database/models/Puppet';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}
// Define a type for the reply functions
type ReplyFunction = (message: Message, args: string[]) => void;

// Replies object containing all command logic
export const replies: Record<string, ReplyFunction> = {
    '!hello': (message, args) => {
        const user = args[0] ? `<@${args[0].replace(/[<@!>]/g, '')}>` : message.author.username;
        message.reply(`Hello, ${user}!`);
    },

    '!ping': (message) => {
        message.reply('Pong!');
    },

    '!roll': (message, args) => {
        const max = args[0] ? parseInt(args[0], 10) : 100; // Default to 100 if no argument is provided
        if (isNaN(max)) {
            message.reply('Please provide a valid number (e.g., `!roll 20`).');
            return;
        }
        const randomNumber = Math.floor(Math.random() * max) + 1;
        message.reply(`You rolled a ${randomNumber}!`);
    },

    '!greet': (message, args) => {
        const user = args[0] ? `<@${args[0].replace(/[<@!>]/g, '')}>` : 'everyone';
        message.reply(`Hello, ${user}! How are you today?`);
    },

    // New command with options
    '!add': (message, args) => {
        const num1 = parseFloat(args[0]);
        const num2 = parseFloat(args[1]);
        if (isNaN(num1) || isNaN(num2)) {
            message.reply('Please provide two valid numbers (e.g., `!add 5 10`).');
            return;
        }
        const sum = num1 + num2;
        message.reply(`The sum of ${num1} and ${num2} is ${sum}.`);
    },
    '!mypuppets': async (message) => {
        const puppets = await dbUtils.getUserPuppets(message.author.id);
        if (puppets.length === 0) {
            message.reply("You don't have any puppets!");
            return;
        }
        const puppetList = puppets.map((p: Puppet) => `• ${p.name}: ${p.description || 'No description'}`).join('\n');
        message.reply(`Your puppets:\n${puppetList}`);
    },

    '!addpuppet': async (message, args) => {
        const [name, suffix, ...descParts] = args;
        if (!name || !suffix) {
            return message.reply('Usage: `!addpuppet <name> <suffix> [description]`');
        }

        try {
            // Check suffix availability
            const existing = await dbUtils.getPuppetBySuffix(message.author.id, suffix);
            if (existing) {
                return message.reply(`Suffix "${suffix}" already taken!`);
            }

            const newPuppet = await dbUtils.createPuppet({
                user_id: message.author.id,
                name,
                suffix,
                description: descParts.join(' '),
                avatar: message.attachments.first()?.url,
            });

            message.reply(`Created puppet ${newPuppet.name} with suffix "${newPuppet.suffix}"!`);
        } catch (error) {
            logger.error('Puppet command failed:', {
                error: getErrorMessage(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: message.author.id,
                channelId: message.channel.id,
            });

            const errorMessage = `Failed to execute puppet command: ${getErrorMessage(error)}`;

            if (message.deletable) {
                await message
                    .reply(errorMessage)
                    .then((msg) => setTimeout(() => msg.delete(), 5000))
                    .catch(logger.error);
            } else {
                logger.warn('Could not send error response', {
                    originalError: getErrorMessage(error),
                });
            }
        }
    },

    '!puppet': async (message) => {
        try {
            const content = message.content.replace(/^!puppet\s*/i, '');
            const [, puppetName, actionType, puppetContent] = content.match(/(.*?)(:{1,2})\s*(.*)/) || [];

            if (!puppetName || !puppetContent) {
                return message.reply(`Invalid format! Use:
\`!puppet Name: Message\` for speaking
\`!puppet Name:: Action\` for emoting`);
            }

            const isAction = actionType === '::';
            const puppet = await dbUtils.getPuppetByName(message.author.id, puppetName.trim());

            if (!puppet) {
                return message.reply(`Puppet "${puppetName}" not found!`);
            }

            // Create and use webhook
            const webhook = await (message.channel as TextChannel).createWebhook({
                name: puppet.name,
                avatar: puppet.avatar || undefined,
            });

            await webhook.send({
                content: isAction ? `*${puppetContent}*` : puppetContent,
                username: puppet.name,
                avatarURL: puppet.avatar || undefined,
            });

            // Cleanup
            await webhook.delete();
            await message.delete().catch((error) => logger.error('Failed to delete message:', error));
        } catch (error) {
            logger.error('Puppet command failed:', {
                error: getErrorMessage(error),
                stack: error instanceof Error ? error.stack : undefined,
                userId: message.author.id,
                channelId: message.channel.id,
            });

            const errorMessage = `Failed to execute puppet command: ${getErrorMessage(error)}`;

            if (message.deletable) {
                await message
                    .reply(errorMessage)
                    .then((msg) => setTimeout(() => msg.delete(), 5000))
                    .catch(logger.error);
            } else {
                logger.warn('Could not send error response', {
                    originalError: getErrorMessage(error),
                });
            }
        }
    },

    '!help': async (message) => {
        try {
            // Inside your help command implementation
            const commands = {
                'Basic Commands': {
                    '!hello [user]': 'Say hello to a user',
                    '!ping': 'Check if the bot is responsive',
                    '!roll [max=100]': 'Roll random number (1-max)',
                    '!add <num1> <num2>': 'Add two numbers',
                },
                '🐭 Puppet System': {
                    '!addpuppet <name> <suffix> [desc]': 'Create puppet with short suffix',
                    '[suffix]: Message': 'Make puppet speak',
                    '[suffix]:: Action': 'Make puppet emote',
                    '!mypuppets': 'List your puppets',
                },
                '🔧 Utilities': {
                    '!help': 'Show this help message',
                    '!greet [user]': 'Greet a user or everyone',
                },
            };

            // Then in your embed builder
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🌟 Bot Command Help')
                .setDescription('**Syntax Guide:**\n`<required>` `[optional]` `[attachment]`')
                .setThumbnail(message.client.user?.displayAvatarURL() || null)
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL(),
                });

            // Add fields
            for (const [category, cmds] of Object.entries(commands)) {
                embed.addFields({
                    name: category,
                    value: Object.entries(cmds)
                        .map(([cmd, desc]) => `**\`${cmd}\`**\n${desc}`)
                        .join('\n\n'),
                    inline: true,
                });
            }

            await message.reply({
                embeds: [embed],
                allowedMentions: { repliedUser: false },
            });

            logger.info('Help command executed', {
                user: message.author.tag,
                channel: message.channel.id,
            });
        } catch (error) {
            logger.error('Failed to send help command:', error);
            message.reply('❌ Failed to display help. Please try again later.');
        }
    },
};
