import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Say hello to a user')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('The user to greet')
            .setRequired(false),
    );