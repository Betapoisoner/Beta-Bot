import { ChatInputCommandInteraction } from 'discord.js';

type InteractionHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;

export const interactionHandlers: Record<string, InteractionHandler> = {
    hello: async (interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply(`Hello, ${user.username}!`);
    },
    roll: async (interaction) => {
        const max = interaction.options.getInteger('max') || 100;
        const randomNumber = Math.floor(Math.random() * max) + 1;
        await interaction.reply(`You rolled a ${randomNumber}!`);
    },
};