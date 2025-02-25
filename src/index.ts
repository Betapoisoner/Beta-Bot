import { Client, GatewayIntentBits } from 'discord.js';
import dotenv = require("dotenv");
import { replies } from './interactions/replies';
import { interactionHandlers } from './interactions/handler';

// Load .env file
dotenv.config();

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
    console.error('Missing DISCORD_TOKEN in .env file.');
    process.exit(1);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Split the message content into command and arguments
    const [command, ...args] = message.content.split(' ');

    // Check if the command exists in the replies object
    if (replies[command]) {
        // Execute the corresponding reply function with arguments
        replies[command](message, args);
    } else {
        // Handle unknown commands
        message.reply('Unknown command. Try `!help` for a list of commands.');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const handler = interactionHandlers[interaction.commandName];
    if (!handler) {
        await interaction.reply('Unknown command.');
        return;
    }

    try {
        await handler(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred.');
    }
});


client.login(token);