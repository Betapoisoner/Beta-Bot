import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a random number')
    .addIntegerOption((option) =>
        option
            .setName('max')
            .setDescription('Maximum number (default: 100)')
            .setRequired(false),
    );