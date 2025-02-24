import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const commands = [
    {
        name: 'hello',
        description: 'Say hello to a user',
        options: [
            {
                name: 'user',
                description: 'The user to greet',
                type: 6, // Type 6 is USER
                required: false,
            },
        ],
    },
    {
        name: 'roll',
        description: 'Roll a random number',
        options: [
            {
                name: 'max',
                description: 'The maximum number to roll',
                type: 4, // Type 4 is INTEGER
                required: false,
            },
        ],
    },
    {
        name: 'greet',
        description: 'Greet a user or everyone',
        options: [
            {
                name: 'user',
                description: 'The user to greet',
                type: 6, // Type 6 is USER
                required: false,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!), // Replace with your bot's client ID
            { body: commands },
        );

        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();