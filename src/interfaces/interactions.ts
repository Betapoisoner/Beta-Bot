import { ChatInputCommandInteraction } from 'discord.js';

export type InteractionHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;

export interface InteractionHandlers {
    [key: string]: InteractionHandler;
}